import { prisma } from "@/lib/db/prisma";
import { TrustFlagType } from "@prisma/client";
import type { InputJsonObject } from "@prisma/client/runtime/library";

const SPAM_THRESHOLD = 8;        // contributions per 6 hours

export async function analyzeContributorRisk(userId: string): Promise<{
  riskScore: number;
  flags: Partial<Record<TrustFlagType, number>>;
}> {
  const flags: Partial<Record<TrustFlagType, number>> = {};
  let riskScore = 0;

  const [recentContribs, recentVotes, aiFailed, openFlags] = await Promise.all([
    prisma.contribution.count({
      where: {
        authorId: userId,
        createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      },
    }),
    prisma.communityVote.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    }),
    prisma.contribution.count({
      where: {
        authorId: userId,
        aiAnalysis: { misinformationRisk: { gte: 80 } },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.trustFlag.count({
      where: { userId, resolvedAt: null },
    }),
  ]);

  if (recentContribs >= SPAM_THRESHOLD) {
    flags.SPAM_FARMING = recentContribs;
    riskScore += 0.35;
  }

  if (recentVotes >= 30) {
    flags.VOTE_BRIGADING = recentVotes;
    riskScore += 0.25;
  }

  if (aiFailed >= 3) {
    flags.QUALITY_BREACH = aiFailed;
    riskScore += 0.25;
  }

  if (openFlags >= 2) {
    riskScore += 0.15;
  }

  return { riskScore: Math.min(1, riskScore), flags };
}

export async function flagUser(
  userId: string,
  flagType: TrustFlagType,
  severity: number,
  details?: Record<string, unknown>,
): Promise<void> {
  await prisma.trustFlag.create({
    data: {
      userId,
      flagType,
      severity: Math.min(1, Math.max(0, severity)),
      details: details as InputJsonObject | undefined,
    },
  });

  // Auto-suspend if severity high + multiple flags
  const openFlags = await prisma.trustFlag.count({
    where: { userId, resolvedAt: null, severity: { gte: 0.7 } },
  });

  if (openFlags >= 3) {
    await prisma.publicUser.update({
      where: { id: userId },
      data: {
        suspendedAt: new Date(),
        suspendedReason: "Automated trust safety — repeated high-severity flags",
      },
    });
  }
}

export async function resolveFlag(flagId: string, resolvedBy: string): Promise<void> {
  await prisma.trustFlag.update({
    where: { id: flagId },
    data: { resolvedAt: new Date(), resolvedBy },
  });
}

export async function runAutoModeration(contributionId: string, authorId: string): Promise<{
  blocked: boolean;
  reason?: string;
}> {
  const [aiAnalysis, author] = await Promise.all([
    prisma.aIAnalysis.findUnique({ where: { contributionId } }),
    prisma.publicUser.findUnique({ where: { id: authorId }, select: { suspendedAt: true } }),
  ]);

  if (author?.suspendedAt) {
    return { blocked: true, reason: "Account suspended" };
  }

  if (aiAnalysis?.misinformationRisk !== null && (aiAnalysis?.misinformationRisk ?? 0) >= 90) {
    await flagUser(authorId, "AI_GENERATED_JUNK", 0.8, {
      contributionId,
      misinformationRisk: aiAnalysis?.misinformationRisk,
    });
    return { blocked: true, reason: "High AI misinformation risk score" };
  }

  const { riskScore, flags } = await analyzeContributorRisk(authorId);
  if (riskScore >= 0.7) {
    for (const [flagType, count] of Object.entries(flags)) {
      await flagUser(authorId, flagType as TrustFlagType, riskScore, { count });
    }
    return { blocked: true, reason: "Automated risk threshold exceeded" };
  }

  return { blocked: false };
}

export async function getTrustFlags(opts?: { userId?: string; resolved?: boolean; limit?: number }) {
  return prisma.trustFlag.findMany({
    where: {
      ...(opts?.userId ? { userId: opts.userId } : {}),
      ...(opts?.resolved !== undefined ? { resolvedAt: opts.resolved ? { not: null } : null } : {}),
    },
    include: {
      user: { select: { username: true, displayName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
  });
}
