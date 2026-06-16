import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { findStoryChainsByEntityIds } from '@/lib/intelligence/repositories/story-chain';
import type { ClassifiedStoryLink } from '@/lib/intelligence/types';

// Min confidence for a link to count as a vote for chain assignment
const MIN_CONFIDENCE = 0.65;

// Assign a new article to the best-matching story chain based on:
// 1. Story links to articles already in a chain (primary signal)
// 2. Entity overlap with existing chains (fallback)
// Returns the assigned storyChainId or null if no chain matched.
export async function assignArticleToStoryChain(
  articleId: string,
  links: ClassifiedStoryLink[],
  entityIds: string[],
): Promise<string | null> {
  // Skip articles already assigned
  const existing = await prisma.article.findUnique({
    where: { id: articleId },
    select: { storyChainId: true },
  });
  if (existing?.storyChainId) return existing.storyChainId;

  // Primary: look at high-confidence links to articles that belong to chains
  const qualifyingLinks = links.filter((l) => l.confidence >= MIN_CONFIDENCE);
  const linkedArticleIds = qualifyingLinks.map((l) =>
    l.sourceArticleId === articleId ? l.targetArticleId : l.sourceArticleId,
  );

  let bestChainId: string | null = null;

  if (linkedArticleIds.length > 0) {
    const linkedArticles = await prisma.article.findMany({
      where: { id: { in: linkedArticleIds }, storyChainId: { not: null } },
      select: { id: true, storyChainId: true },
    });

    if (linkedArticles.length > 0) {
      // Weight each chain by sum of link confidences
      const chainWeight = new Map<string, number>();
      for (const a of linkedArticles) {
        if (!a.storyChainId) continue;
        const link = qualifyingLinks.find(
          (l) => l.sourceArticleId === a.id || l.targetArticleId === a.id,
        );
        const w = link?.confidence ?? MIN_CONFIDENCE;
        chainWeight.set(a.storyChainId, (chainWeight.get(a.storyChainId) ?? 0) + w);
      }

      if (chainWeight.size > 0) {
        const sorted = [...chainWeight.entries()].sort((a, b) => b[1] - a[1]);
        bestChainId = sorted[0][0];
      }
    }
  }

  // Fallback: entity-based chain lookup
  if (!bestChainId && entityIds.length > 0) {
    const chains = await findStoryChainsByEntityIds(entityIds);
    if (chains.length > 0) bestChainId = chains[0].id;
  }

  if (!bestChainId) return null;

  // Assign + increment counter atomically
  await prisma.$transaction([
    prisma.article.update({
      where: { id: articleId },
      data: { storyChainId: bestChainId },
    }),
    prisma.storyChain.update({
      where: { id: bestChainId },
      data: { totalArticles: { increment: 1 }, lastUpdated: new Date() },
    }),
  ]);

  return bestChainId;
}
