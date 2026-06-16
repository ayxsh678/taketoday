import 'server-only';
import { createDossier, findDossierForStoryChain, updateDossier } from '@/lib/intelligence/repositories/dossier';
import type { SynthesisResult } from './react-loop';
import type { TimelineEvent, WatchItem, RiskFactor } from '@/lib/intelligence/types';
import type { ResearchDossier } from '@prisma/client';

// Convert SynthesisResult (from ReAct loop) into a persisted ResearchDossier.
// Upserts: updates if a dossier already exists for this chain, otherwise creates.
export async function buildAndPersistDossier(
  storyChainId: string,
  chainTitle: string,
  synthesis: SynthesisResult,
): Promise<ResearchDossier> {
  const timeline: TimelineEvent[] = synthesis.timeline.map((t) => ({
    date: new Date(t.date),
    title: t.title,
    description: t.description,
    importance: t.importance,
  }));

  const watchList: WatchItem[] = synthesis.watchList.map((w) => ({
    entity: w.entity,
    description: w.description,
    triggerKeywords: w.triggerKeywords,
    importance: w.importance,
  }));

  const riskFactors: RiskFactor[] = (synthesis.riskFactors ?? []).map((r) => ({
    description: r.description,
    likelihood: r.likelihood,
    impact: r.impact,
    entityIds: r.entityIds,
  }));

  const sourcesConsulted = synthesis.sourcesConsulted.slice(0, 30).map((url) => {
    let name = url;
    try {
      name = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      // keep raw
    }
    return { url, name, credibility: 50 };
  });

  // Upsert: update existing or create new
  const existing = await findDossierForStoryChain(storyChainId);

  if (existing) {
    return updateDossier(existing.id, {
      executiveSummary: synthesis.executiveSummary,
      keyFindings: synthesis.keyFindings,
      timeline,
      openQuestions: synthesis.openQuestions,
      watchList,
      riskFactors,
      confidenceScore: synthesis.confidenceScore,
    });
  }

  return createDossier({
    storyChainId,
    title: `Research Dossier: ${chainTitle}`,
    executiveSummary: synthesis.executiveSummary,
    keyFindings: synthesis.keyFindings,
    timeline,
    openQuestions: synthesis.openQuestions,
    sourcesConsulted,
    watchList,
    riskFactors,
    confidenceScore: synthesis.confidenceScore,
    importanceScore: 70,
  });
}
