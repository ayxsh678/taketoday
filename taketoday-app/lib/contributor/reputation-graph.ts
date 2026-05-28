import { prisma } from "@/lib/db/prisma";
import { RepDimension } from "@prisma/client";

// Decay rate: 2% per week per dimension (encourages sustained activity)
const DECAY_RATE = 0.02;
const DECAY_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

// Dimension weights for overall score
const DIM_WEIGHTS: Record<RepDimension, number> = {
  REPORTING: 0.25,
  FACT_CHECK: 0.20,
  RESEARCH: 0.15,
  MODERATION: 0.10,
  ACCURACY: 0.15,
  SOURCE: 0.05,
  COLLABORATION: 0.05,
  COMMUNITY: 0.05,
};

const DIM_CAPS: Record<RepDimension, number> = {
  REPORTING: 1000,
  FACT_CHECK: 800,
  RESEARCH: 700,
  MODERATION: 500,
  ACCURACY: 600,
  SOURCE: 400,
  COLLABORATION: 300,
  COMMUNITY: 400,
};

export async function addReputationEvent(
  userId: string,
  dimension: RepDimension,
  delta: number,
  reason: string,
  sourceId?: string,
  sourceType?: string,
): Promise<void> {
  await prisma.reputationEvent.create({
    data: { userId, dimension, delta, reason, sourceId, sourceType },
  });

  const repDim = await prisma.reputationDimension.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  const dimKey = dimensionToField(dimension);
  const currentVal = (repDim[dimKey] as number) ?? 0;
  const cap = DIM_CAPS[dimension];
  const newVal = Math.max(0, Math.min(cap, currentVal + delta));

  const updated = await prisma.reputationDimension.update({
    where: { userId },
    data: { [dimKey]: newVal },
  });

  // Recompute overall
  const overall = computeOverall(updated);
  await prisma.reputationDimension.update({
    where: { userId },
    data: { overallScore: overall },
  });
}

export async function getReputationDimensions(userId: string) {
  return prisma.reputationDimension.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function applyReputationDecay(userId: string): Promise<void> {
  const repDim = await prisma.reputationDimension.findUnique({ where: { userId } });
  if (!repDim) return;

  const now = Date.now();
  const lastDecay = repDim.lastDecayAt?.getTime() ?? 0;
  if (now - lastDecay < DECAY_INTERVAL_MS) return;

  const weeks = Math.floor((now - lastDecay) / DECAY_INTERVAL_MS);
  const factor = Math.pow(1 - DECAY_RATE, weeks);

  await prisma.reputationDimension.update({
    where: { userId },
    data: {
      reportingScore: repDim.reportingScore * factor,
      factCheckScore: repDim.factCheckScore * factor,
      researchScore: repDim.researchScore * factor,
      moderationScore: repDim.moderationScore * factor,
      accuracyScore: repDim.accuracyScore * factor,
      sourceScore: repDim.sourceScore * factor,
      collaborationScore: repDim.collaborationScore * factor,
      communityScore: repDim.communityScore * factor,
      overallScore: repDim.overallScore * factor,
      lastDecayAt: new Date(),
    },
  });
}

export async function computeFraudRisk(userId: string): Promise<number> {
  const [recentContributions, votes, trustFlags] = await Promise.all([
    prisma.contribution.count({
      where: {
        authorId: userId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.communityVote.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    }),
    prisma.trustFlag.count({
      where: { userId, resolvedAt: null },
    }),
  ]);

  let risk = 0;
  if (recentContributions > 10) risk += 0.3; // >10 contributions in 24h
  if (votes > 20) risk += 0.3; // >20 votes in 1h
  if (trustFlags > 0) risk += 0.2 * trustFlags;

  return Math.min(1, risk);
}

function dimensionToField(dim: RepDimension): keyof import("@prisma/client").ReputationDimension {
  const map: Record<RepDimension, keyof import("@prisma/client").ReputationDimension> = {
    REPORTING: "reportingScore",
    FACT_CHECK: "factCheckScore",
    RESEARCH: "researchScore",
    MODERATION: "moderationScore",
    ACCURACY: "accuracyScore",
    SOURCE: "sourceScore",
    COLLABORATION: "collaborationScore",
    COMMUNITY: "communityScore",
  };
  return map[dim];
}

function computeOverall(repDim: import("@prisma/client").ReputationDimension): number {
  let total = 0;
  for (const [dim, weight] of Object.entries(DIM_WEIGHTS)) {
    const field = dimensionToField(dim as RepDimension);
    const val = (repDim[field] as number) ?? 0;
    const cap = DIM_CAPS[dim as RepDimension];
    total += (val / cap) * weight * 100;
  }
  return Math.round(total * 10) / 10;
}
