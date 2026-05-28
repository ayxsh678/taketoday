import type { ReputationTier } from "./types";
import { REPUTATION_THRESHOLDS } from "./types";
import { prisma } from "@/lib/db/prisma";

export function tierFromScore(score: number): ReputationTier {
  if (score >= REPUTATION_THRESHOLDS.EXPERT) return "EXPERT";
  if (score >= REPUTATION_THRESHOLDS.VERIFIED) return "VERIFIED";
  if (score >= REPUTATION_THRESHOLDS.TRUSTED) return "TRUSTED";
  if (score >= REPUTATION_THRESHOLDS.CONTRIBUTOR) return "CONTRIBUTOR";
  return "NEWCOMER";
}

interface ReputationWeights {
  publishRate: number;    // 0–1: how many submissions get published
  factCheckAccuracy: number; // 0–1
  communityTrust: number;    // 0–1
  editorialTrust: number;    // 0–1
}

export function calculateReputationScore(weights: ReputationWeights): number {
  return Math.round(
    weights.publishRate * 40 +
    weights.factCheckAccuracy * 30 +
    weights.communityTrust * 20 +
    weights.editorialTrust * 10
  );
}

export async function recalculateReputation(userId: string): Promise<void> {
  const user = await prisma.publicUser.findUnique({
    where: { id: userId },
    include: {
      contributions: {
        where: { status: { in: ["PUBLISHED", "APPROVED"] } },
        select: { id: true },
      },
      factChecks: {
        select: { verdict: true },
      },
      communityVotes: {
        select: { weight: true },
      },
    },
  });

  if (!user) return;

  const totalContributions = await prisma.contribution.count({ where: { authorId: userId } });
  const publishedCount = user.contributions.length;
  const publishRate = totalContributions > 0 ? publishedCount / totalContributions : 0;

  // Community trust: avg weight of votes on their contributions weighted by count
  const communityVoteData = await prisma.communityVote.findMany({
    where: {
      contribution: { authorId: userId },
      type: "CREDIBLE",
    },
    select: { weight: true },
  });
  const communityTrust =
    communityVoteData.length > 0
      ? communityVoteData.reduce((acc, v) => acc + v.weight, 0) / communityVoteData.length / 3
      : 0;

  const reputation = await prisma.contributorReputation.findUnique({ where: { userId } });
  const editorialTrust = reputation ? reputation.editorialTrustScore / 100 : 0;
  const factCheckAccuracy = reputation ? reputation.factCheckAccuracy / 100 : 0;

  const overallScore = calculateReputationScore({
    publishRate,
    factCheckAccuracy,
    communityTrust: Math.min(communityTrust, 1),
    editorialTrust,
  });

  const tier = tierFromScore(overallScore);

  await prisma.contributorReputation.upsert({
    where: { userId },
    create: {
      userId,
      totalContributions,
      publishedCount,
      communityTrustScore: communityTrust * 100,
      editorialTrustScore: editorialTrust * 100,
      factCheckAccuracy: factCheckAccuracy * 100,
      overallScore,
      tier,
      lastRecalculatedAt: new Date(),
    },
    update: {
      totalContributions,
      publishedCount,
      communityTrustScore: communityTrust * 100,
      overallScore,
      tier,
      lastRecalculatedAt: new Date(),
    },
  });
}
