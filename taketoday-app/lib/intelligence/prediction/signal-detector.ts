import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { findDossierForStoryChain } from '@/lib/intelligence/repositories/dossier';
import type { WatchSignal } from '@/lib/intelligence/types';
import type { RiskFactor } from '@/lib/intelligence/types';

export interface DetectedSignals {
  watchSignals: WatchSignal[];
  escalationDetected: boolean;
  contradictionDetected: boolean;
  predictiveClaims: string[];
  riskFactors: RiskFactor[];
  topEntityIds: string[];
}

// Extract actionable signals from a story chain's links, claims, and dossier.
// These signals inform the prediction generator about what patterns to extrapolate.
export async function detectSignals(storyChainId: string): Promise<DetectedSignals> {
  const [chain, dossier] = await Promise.all([
    prisma.storyChain.findUnique({
      where: { id: storyChainId },
      select: { centralEntityIds: true, unresolvedThreads: true },
    }),
    findDossierForStoryChain(storyChainId),
  ]);

  // Pull article IDs in this chain
  const articleRows = await prisma.article.findMany({
    where: { storyChainId },
    select: { id: true },
  });
  const articleIds = articleRows.map((a) => a.id);

  if (articleIds.length === 0) {
    return {
      watchSignals: [],
      escalationDetected: false,
      contradictionDetected: false,
      predictiveClaims: [],
      riskFactors: [],
      topEntityIds: [],
    };
  }

  // Query story link types for signal patterns
  const [escalationLinks, contradictionLinks, predictiveClaims] = await Promise.all([
    prisma.storyLink.findMany({
      where: {
        sourceArticleId: { in: articleIds },
        relationshipType: 'ESCALATION',
        confidence: { gte: 0.65 },
      },
      select: { causalExplanation: true, confidence: true },
      take: 3,
    }),
    prisma.storyLink.findMany({
      where: {
        sourceArticleId: { in: articleIds },
        relationshipType: { in: ['CONTRADICTION', 'REFUTATION'] },
        confidence: { gte: 0.65 },
      },
      select: { causalExplanation: true },
      take: 3,
    }),
    prisma.claim.findMany({
      where: {
        articleId: { in: articleIds },
        claimType: 'PREDICTIVE',
        confidence: { gte: 50 },
      },
      select: { text: true, confidence: true },
      orderBy: { confidence: 'desc' },
      take: 5,
    }),
  ]);

  // Top entities by mention count in this chain
  const entityRows = await prisma.entityMention.groupBy({
    by: ['entityId'],
    where: { articleId: { in: articleIds } },
    _count: { entityId: true },
    orderBy: { _count: { entityId: 'desc' } },
    take: 8,
  });
  const topEntityIds = entityRows.map((r) => r.entityId);

  // Build WatchSignals from unresolved threads + escalations + entity watchlist
  const watchSignals: WatchSignal[] = [];

  // From dossier watchList (most reliable source)
  const dossierWatchList = (dossier?.watchList ?? []) as unknown as WatchSignal[];
  watchSignals.push(...dossierWatchList.slice(0, 5));

  // From unresolved threads
  for (const thread of (chain?.unresolvedThreads ?? []).slice(0, 3)) {
    watchSignals.push({
      description: thread,
      entityToMonitor: '',
      triggerKeywords: extractKeywords(thread),
      importance: 'medium',
    });
  }

  // From escalation signals
  for (const link of escalationLinks) {
    if (link.causalExplanation) {
      watchSignals.push({
        description: link.causalExplanation,
        entityToMonitor: '',
        triggerKeywords: extractKeywords(link.causalExplanation),
        importance: link.confidence >= 0.8 ? 'high' : 'medium',
      });
    }
  }

  const riskFactors = (dossier?.riskFactors ?? []) as unknown as RiskFactor[];

  return {
    watchSignals: watchSignals.slice(0, 10),
    escalationDetected: escalationLinks.length > 0,
    contradictionDetected: contradictionLinks.length > 0,
    predictiveClaims: predictiveClaims.map((c) => c.text),
    riskFactors: riskFactors.slice(0, 5),
    topEntityIds,
  };
}

function extractKeywords(text: string): string[] {
  // Extract likely trigger keywords: capitalized words + quoted phrases
  const words = text.match(/\b[A-Z][a-z]{2,}\b|\b[A-Z]{2,}\b/g) ?? [];
  return [...new Set(words)].slice(0, 5);
}
