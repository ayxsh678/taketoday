import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import type { ResearchDossier } from '@prisma/client';
import type { TimelineEvent, WatchItem, RiskFactor } from '@/lib/intelligence/types';

export async function findDossierById(id: string): Promise<ResearchDossier | null> {
  return prisma.researchDossier.findUnique({ where: { id } });
}

export async function findDossierForStoryChain(storyChainId: string): Promise<ResearchDossier | null> {
  return prisma.researchDossier.findFirst({
    where: { storyChainId },
    orderBy: { generatedAt: 'desc' },
  });
}

export async function createDossier(data: {
  storyChainId: string;
  title: string;
  executiveSummary?: string;
  keyFindings?: string[];
  timeline?: TimelineEvent[];
  openQuestions?: string[];
  sourcesConsulted?: Array<{ url: string; name: string; credibility: number }>;
  watchList?: WatchItem[];
  riskFactors?: RiskFactor[];
  importanceScore?: number;
  confidenceScore?: number;
}): Promise<ResearchDossier> {
  return prisma.researchDossier.create({
    data: {
      storyChainId: data.storyChainId,
      title: data.title,
      executiveSummary: data.executiveSummary,
      keyFindings: data.keyFindings ?? [],
      timeline: (data.timeline ?? []) as unknown as Prisma.InputJsonValue,
      openQuestions: (data.openQuestions ?? []) as unknown as Prisma.InputJsonValue,
      sourcesConsulted: (data.sourcesConsulted ?? []) as unknown as Prisma.InputJsonValue,
      watchList: (data.watchList ?? []) as unknown as Prisma.InputJsonValue,
      riskFactors: (data.riskFactors ?? []) as unknown as Prisma.InputJsonValue,
      importanceScore: data.importanceScore ?? 50,
      confidenceScore: data.confidenceScore ?? 50,
    },
  });
}

export async function updateDossier(
  id: string,
  data: {
    executiveSummary?: string;
    keyFindings?: string[];
    timeline?: TimelineEvent[];
    openQuestions?: string[];
    watchList?: WatchItem[];
    riskFactors?: RiskFactor[];
    confidenceScore?: number;
  },
): Promise<ResearchDossier> {
  return prisma.researchDossier.update({
    where: { id },
    data: {
      ...(data.executiveSummary !== undefined ? { executiveSummary: data.executiveSummary } : {}),
      ...(data.keyFindings ? { keyFindings: data.keyFindings } : {}),
      ...(data.timeline ? { timeline: data.timeline as unknown as Prisma.InputJsonValue } : {}),
      ...(data.openQuestions ? { openQuestions: data.openQuestions as unknown as Prisma.InputJsonValue } : {}),
      ...(data.watchList ? { watchList: data.watchList as unknown as Prisma.InputJsonValue } : {}),
      ...(data.riskFactors ? { riskFactors: data.riskFactors as unknown as Prisma.InputJsonValue } : {}),
      ...(data.confidenceScore !== undefined ? { confidenceScore: data.confidenceScore } : {}),
    },
  });
}
