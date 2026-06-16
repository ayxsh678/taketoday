import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { runReActLoop } from './react-loop';
import { buildAndPersistDossier } from './dossier-builder';
import type { ResearchDossier } from '@prisma/client';

export interface ResearchAgentResult {
  storyChainId: string;
  dossierId: string | null;
  ran: boolean;
  reason?: string;
}

// Minimum article count before research is worth triggering
const MIN_ARTICLES_FOR_RESEARCH = 2;

// Run the full ReAct research agent for a story chain.
// Produces (or updates) a ResearchDossier with executive summary, key findings,
// timeline, open questions, watch list, and risk factors.
export async function runResearchAgent(storyChainId: string): Promise<ResearchAgentResult> {
  const chain = await prisma.storyChain.findUnique({
    where: { id: storyChainId },
    select: {
      id: true,
      title: true,
      livingNarrative: true,
      totalArticles: true,
      articles: {
        orderBy: { publishedAt: 'desc' },
        take: 8,
        select: { headline: true, excerpt: true, publishedAt: true },
      },
    },
  });

  if (!chain) {
    return { storyChainId, dossierId: null, ran: false, reason: 'chain_not_found' };
  }

  if (chain.totalArticles < MIN_ARTICLES_FOR_RESEARCH) {
    return {
      storyChainId,
      dossierId: null,
      ran: false,
      reason: `too_few_articles: ${chain.totalArticles}/${MIN_ARTICLES_FOR_RESEARCH}`,
    };
  }

  const articleSummaries = chain.articles
    .map((a, i) => {
      const date = a.publishedAt?.toISOString().slice(0, 10) ?? 'undated';
      return `${i + 1}. [${date}] ${a.headline}${a.excerpt ? ` — ${a.excerpt.slice(0, 150)}` : ''}`;
    })
    .join('\n');

  const synthesis = await runReActLoop({
    topic: chain.title,
    articleSummaries,
    existingNarrative: chain.livingNarrative ?? undefined,
  });

  if (!synthesis) {
    return { storyChainId, dossierId: null, ran: false, reason: 'synthesis_failed' };
  }

  const dossier = await buildAndPersistDossier(storyChainId, chain.title, synthesis);

  return { storyChainId, dossierId: dossier.id, ran: true };
}

// Convenience: check if a chain already has a fresh dossier (< 24h old)
export async function hasFreshDossier(storyChainId: string): Promise<boolean> {
  const recent = await prisma.researchDossier.findFirst({
    where: {
      storyChainId,
      generatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    select: { id: true },
  });
  return !!recent;
}

export type { ResearchDossier };
