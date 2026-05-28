import { prisma } from "@/lib/db/prisma";
import { LeaderboardType } from "@prisma/client";
import type { InputJsonObject } from "@prisma/client/runtime/library";

function currentPeriod(): { start: Date; end: Date; scope: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const scope = `month:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return { start, end, scope };
}

export async function refreshLeaderboard(
  boardType: LeaderboardType,
  scope?: string,
): Promise<void> {
  const period = currentPeriod();
  const effectiveScope = scope ?? "global";
  const fullScope = `${effectiveScope}:${period.scope}`;

  let rows: { userId: string; score: number; metadata?: Record<string, unknown> }[] = [];

  switch (boardType) {
    case "OVERALL": {
      const reps = await prisma.reputationDimension.findMany({
        orderBy: { overallScore: "desc" },
        take: 100,
        select: { userId: true, overallScore: true },
      });
      rows = reps.map((r) => ({ userId: r.userId, score: r.overallScore }));
      break;
    }
    case "REPORTING": {
      const reps = await prisma.reputationDimension.findMany({
        orderBy: { reportingScore: "desc" },
        take: 100,
        select: { userId: true, reportingScore: true },
      });
      rows = reps.map((r) => ({ userId: r.userId, score: r.reportingScore }));
      break;
    }
    case "FACT_CHECKING": {
      const reps = await prisma.reputationDimension.findMany({
        orderBy: { factCheckScore: "desc" },
        take: 100,
        select: { userId: true, factCheckScore: true },
      });
      rows = reps.map((r) => ({ userId: r.userId, score: r.factCheckScore }));
      break;
    }
    case "INVESTIGATION": {
      const reps = await prisma.reputationDimension.findMany({
        orderBy: { researchScore: "desc" },
        take: 100,
        select: { userId: true, researchScore: true },
      });
      rows = reps.map((r) => ({ userId: r.userId, score: r.researchScore }));
      break;
    }
    case "ACCURACY": {
      const reps = await prisma.reputationDimension.findMany({
        orderBy: { accuracyScore: "desc" },
        take: 100,
        select: { userId: true, accuracyScore: true },
      });
      rows = reps.map((r) => ({ userId: r.userId, score: r.accuracyScore }));
      break;
    }
    case "COMMUNITY": {
      const reps = await prisma.reputationDimension.findMany({
        orderBy: { communityScore: "desc" },
        take: 100,
        select: { userId: true, communityScore: true },
      });
      rows = reps.map((r) => ({ userId: r.userId, score: r.communityScore }));
      break;
    }
    case "RISING": {
      // Rising: most reputation events in the last 7 days
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const events = await prisma.reputationEvent.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: since }, delta: { gt: 0 } },
        _sum: { delta: true },
        orderBy: { _sum: { delta: "desc" } },
        take: 100,
      });
      rows = events.map((e) => ({ userId: e.userId, score: e._sum.delta ?? 0 }));
      break;
    }
  }

  // Upsert entries
  for (let i = 0; i < rows.length; i++) {
    const { userId, score, metadata } = rows[i];
    await prisma.leaderboardEntry.upsert({
      where: { boardType_scope_userId: { boardType, scope: fullScope, userId } },
      create: {
        boardType,
        scope: fullScope,
        userId,
        rank: i + 1,
        score,
        metadata: metadata as InputJsonObject | undefined,
        periodStart: period.start,
        periodEnd: period.end,
      },
      update: { rank: i + 1, score },
    });
  }
}

export async function getLeaderboard(
  boardType: LeaderboardType,
  opts?: { scope?: string; limit?: number },
) {
  const period = currentPeriod();
  const effectiveScope = opts?.scope ?? "global";
  const fullScope = `${effectiveScope}:${period.scope}`;

  return prisma.leaderboardEntry.findMany({
    where: { boardType, scope: fullScope },
    include: {
      user: {
        select: {
          username: true,
          displayName: true,
          avatar: true,
          isVerifiedJournalist: true,
          reputation: { select: { tier: true } },
        },
      },
    },
    orderBy: { rank: "asc" },
    take: opts?.limit ?? 50,
  });
}
