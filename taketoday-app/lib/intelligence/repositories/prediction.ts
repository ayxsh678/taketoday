import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import type { Prediction, PredictionType, PredictionStatus } from '@prisma/client';
import type { WatchSignal } from '@/lib/intelligence/types';

export async function findPredictionById(id: string): Promise<Prediction | null> {
  return prisma.prediction.findUnique({ where: { id } });
}

export async function listPredictionsForStoryChain(
  storyChainId: string,
  status?: PredictionStatus,
): Promise<Prediction[]> {
  return prisma.prediction.findMany({
    where: { storyChainId, ...(status ? { status } : {}) },
    orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function listActivePredictions(limit = 50): Promise<Prediction[]> {
  return prisma.prediction.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ confidence: 'desc' }, { targetDate: 'asc' }],
    take: limit,
  });
}

export async function createPrediction(data: {
  storyChainId: string;
  text: string;
  predictionType: PredictionType;
  confidence?: number;
  timeframe?: string;
  targetDate?: Date;
  entityIds?: string[];
  signals?: WatchSignal[];
  basis?: string;
  historicalPatterns?: string[];
}): Promise<Prediction> {
  return prisma.prediction.create({
    data: {
      storyChainId: data.storyChainId,
      text: data.text,
      predictionType: data.predictionType,
      confidence: data.confidence ?? 50,
      timeframe: data.timeframe,
      targetDate: data.targetDate,
      entityIds: data.entityIds ?? [],
      signals: (data.signals ?? []) as unknown as Prisma.InputJsonValue,
      basis: data.basis,
      historicalPatterns: data.historicalPatterns ?? [],
    },
  });
}

export async function resolvePrediction(
  predictionId: string,
  outcome: 'correct' | 'incorrect' | 'partially_correct',
): Promise<Prediction> {
  return prisma.prediction.update({
    where: { id: predictionId },
    data: { status: 'RESOLVED', outcome, resolvedAt: new Date() },
  });
}

export async function expireOverduePredictions(): Promise<number> {
  const result = await prisma.prediction.updateMany({
    where: { status: 'ACTIVE', targetDate: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });
  return result.count;
}
