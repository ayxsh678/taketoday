import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { retrieveLinkingCandidates } from './retrieval';
import { rankAndFilter } from './scoring';
import { classifyRelationship } from './classifier';
import { createStoryLink } from '@/lib/intelligence/repositories/story-link';
import { findEntityMentionsByArticle } from '@/lib/intelligence/repositories/entity';
import type { ClassifiedStoryLink } from '@/lib/intelligence/types';

// Main entry point — links a newly created article to related historical articles
export async function linkArticleToStories(articleId: string): Promise<ClassifiedStoryLink[]> {
  // Fetch article metadata needed for candidate scoring
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      headline: true,
      excerpt: true,
      body: true,
      publishedAt: true,
      createdAt: true,
      categoryId: true,
    },
  });
  if (!article) return [];

  const publishedAt = article.publishedAt ?? article.createdAt;

  // Get entity IDs extracted for this article
  const mentions = await findEntityMentionsByArticle(articleId);
  const entityIds = mentions.map((m) => m.entityId);

  // Phase 1: Candidate retrieval (3 signals combined)
  const candidates = await retrieveLinkingCandidates(
    articleId,
    article.headline,
    article.excerpt,
    article.body,
    entityIds,
    article.categoryId,
  );

  if (candidates.length === 0) return [];

  // Phase 2: Score + filter to top candidates
  const topCandidates = rankAndFilter(candidates, publishedAt, article.categoryId);

  if (topCandidates.length === 0) return [];

  // Fetch headlines for top candidates (needed for LLM classification)
  const candidateHeadlines = await prisma.article.findMany({
    where: { id: { in: topCandidates.map((c) => c.articleId) } },
    select: { id: true, headline: true },
  });
  const headlineMap = new Map(candidateHeadlines.map((a) => [a.id, a.headline]));

  // Phase 3: LLM relationship classification (parallelized, max 15 candidates)
  const classificationResults = await Promise.allSettled(
    topCandidates.map(async (candidate) => {
      const targetHeadline = headlineMap.get(candidate.articleId) ?? '';
      const temporalDays = Math.round(
        Math.abs(publishedAt.getTime() - candidate.publishedAt.getTime()) / 86400000,
      );

      // Find shared entity IDs between source and target
      const targetMentions = await findEntityMentionsByArticle(candidate.articleId);
      const targetEntitySet = new Set(targetMentions.map((m) => m.entityId));
      const sharedEntityIds = entityIds.filter((id) => targetEntitySet.has(id));

      const sharedTopics = article.categoryId && candidate.categoryId === article.categoryId
        ? [article.categoryId]
        : [];

      return classifyRelationship(
        { id: articleId, headline: article.headline, excerpt: article.excerpt },
        { id: candidate.articleId, headline: targetHeadline },
        sharedEntityIds,
        sharedTopics,
        temporalDays,
      );
    }),
  );

  // Collect successful classifications
  const links: ClassifiedStoryLink[] = [];
  for (const result of classificationResults) {
    if (result.status === 'fulfilled' && result.value) {
      links.push(result.value);
    }
  }

  // Phase 4: Persist story links
  for (const link of links) {
    await createStoryLink({
      sourceArticleId: link.sourceArticleId,
      targetArticleId: link.targetArticleId,
      relationshipType: link.relationshipType,
      confidence: link.confidence,
      sharedEntityIds: link.sharedEntityIds,
      sharedTopics: link.sharedTopics,
      temporalDistanceDays: link.temporalDistanceDays,
      causalExplanation: link.causalExplanation,
      evidenceSnippets: link.evidenceSnippets,
    });
  }

  return links;
}
