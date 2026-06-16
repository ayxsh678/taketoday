import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { detectSignals } from './signal-detector';
import { generatePredictions } from './generator';
import { checkPredictionsAgainstArticle } from './outcome-tracker';
import {
  createPrediction,
  listPredictionsForStoryChain,
} from '@/lib/intelligence/repositories/prediction';
import { findDossierForStoryChain } from '@/lib/intelligence/repositories/dossier';
import type { Prediction } from '@prisma/client';

export interface PredictionEngineResult {
  storyChainId: string;
  predictionsCreated: number;
  predictionsResolved: number;
  predictionsExpired: number;
}

// Minimum importance score to trigger prediction generation
const MIN_IMPORTANCE_FOR_PREDICTIONS = 60;
// Max active predictions per chain before we stop generating new ones
const MAX_ACTIVE_PREDICTIONS = 6;

// Run the full prediction engine for a story chain.
// 1. Detects signals from links, claims, and dossier
// 2. Generates new predictions if below the cap
// 3. Checks active predictions against the triggering article
export async function runPredictionEngine(
  storyChainId: string,
  triggerArticleId?: string,
  triggerHeadline?: string,
  triggerBody?: string,
): Promise<PredictionEngineResult> {
  const chain = await prisma.storyChain.findUnique({
    where: { id: storyChainId },
    select: {
      title: true,
      livingNarrative: true,
      importanceScore: true,
      totalArticles: true,
    },
  });

  if (!chain) {
    return { storyChainId, predictionsCreated: 0, predictionsResolved: 0, predictionsExpired: 0 };
  }

  // Don't predict on low-importance or sparse chains
  if (chain.importanceScore < MIN_IMPORTANCE_FOR_PREDICTIONS || chain.totalArticles < 2) {
    return { storyChainId, predictionsCreated: 0, predictionsResolved: 0, predictionsExpired: 0 };
  }

  // Step 1: Check active predictions against the new article (if provided)
  let predictionsResolved = 0;
  let predictionsExpired = 0;
  if (triggerArticleId && triggerHeadline) {
    try {
      const trackResult = await checkPredictionsAgainstArticle(
        triggerArticleId,
        storyChainId,
        triggerHeadline,
        triggerBody ?? '',
      );
      predictionsResolved = trackResult.resolved;
      predictionsExpired = trackResult.expired;
    } catch {
      // Non-fatal
    }
  }

  // Step 2: Generate new predictions if below cap
  const activePredictions = await listPredictionsForStoryChain(storyChainId, 'ACTIVE');
  if (activePredictions.length >= MAX_ACTIVE_PREDICTIONS) {
    return { storyChainId, predictionsCreated: 0, predictionsResolved, predictionsExpired };
  }

  const signals = await detectSignals(storyChainId);
  const dossier = await findDossierForStoryChain(storyChainId);

  const keyFindings = dossier?.keyFindings ?? [];
  const existingTexts = activePredictions.map((p: Prediction) => p.text);

  const generated = await generatePredictions({
    chainTitle: chain.title,
    livingNarrative: chain.livingNarrative ?? '',
    keyFindings,
    signals,
    existingPredictionTexts: existingTexts,
  });

  // Persist new predictions
  let predictionsCreated = 0;
  for (const pred of generated) {
    try {
      await createPrediction({
        storyChainId,
        text: pred.text,
        predictionType: pred.predictionType,
        confidence: pred.confidence,
        timeframe: pred.timeframe,
        targetDate: pred.targetDate,
        entityIds: signals.topEntityIds.slice(0, 4),
        signals: pred.signals,
        basis: pred.basis,
        historicalPatterns: pred.historicalPatterns,
      });
      predictionsCreated++;
    } catch {
      // Non-fatal — skip individual failures
    }
  }

  return { storyChainId, predictionsCreated, predictionsResolved, predictionsExpired };
}

export { listPredictionsForStoryChain };
