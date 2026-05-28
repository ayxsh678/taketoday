import { prisma } from "@/lib/db/prisma";
import { StreakType } from "@prisma/client";
import { logActivity } from "./activity-feed";

// Grace window: 30 hours (24h + 6h buffer). Weekly: 8 days.
const DAILY_GRACE_MS = 30 * 60 * 60 * 1000;
const WEEKLY_GRACE_MS = 8 * 24 * 60 * 60 * 1000;

const WEEKLY_TYPES = new Set<StreakType>([
  StreakType.WEEKLY_PUBLISHING,
  StreakType.RESEARCH_COLLABORATION,
]);

const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];

function gracePeriodMs(type: StreakType): number {
  return WEEKLY_TYPES.has(type) ? WEEKLY_GRACE_MS : DAILY_GRACE_MS;
}

export async function recordStreakActivity(
  userId: string,
  activityType: StreakType,
  qualityScore = 1.0,
): Promise<{ streak: number; isNew: boolean; milestonesHit: number[] }> {
  // Quality gate: score < 0.4 doesn't count toward streak
  if (qualityScore < 0.4) {
    return { streak: 0, isNew: false, milestonesHit: [] };
  }

  const now = new Date();
  const grace = gracePeriodMs(activityType);

  const existing = await prisma.contributorStreak.findUnique({
    where: { userId_activityType: { userId, activityType } },
  });

  if (!existing) {
    const created = await prisma.contributorStreak.create({
      data: { userId, activityType, currentStreak: 1, longestStreak: 1, lastActivityAt: now },
    });
    const milestonesHit = checkMilestones(1, [], created.milestoneHits);
    if (milestonesHit.length) {
      await prisma.contributorStreak.update({
        where: { id: created.id },
        data: { milestoneHits: { push: milestonesHit } },
      });
      await logActivity(userId, "STREAK_MILESTONE", created.id, {
        streakType: activityType,
        milestones: milestonesHit,
        streak: 1,
      });
    }
    return { streak: 1, isNew: true, milestonesHit };
  }

  const last = existing.lastActivityAt;
  const elapsed = last ? now.getTime() - last.getTime() : Infinity;

  let newStreak = existing.currentStreak;
  let graceUsedAt = existing.graceUsedAt;

  if (elapsed <= grace) {
    // Still within grace — same streak window, no increment (activity already counted)
    // But if last was > half-grace ago, increment streak
    const halfGrace = grace / 2;
    if (elapsed > halfGrace) {
      newStreak += 1;
    } else {
      // Same day/window — no change
      return { streak: existing.currentStreak, isNew: false, milestonesHit: [] };
    }
  } else if (elapsed <= grace * 2 && existing.freezesLeft > 0) {
    // Missed window but has freeze — use freeze, continue streak
    newStreak += 1;
    await prisma.contributorStreak.update({
      where: { id: existing.id },
      data: { freezesLeft: { decrement: 1 } },
    });
    graceUsedAt = now;
  } else if (elapsed <= grace * 2 && !graceUsedAt) {
    // One-time grace window (no freeze needed, first miss)
    newStreak += 1;
    graceUsedAt = now;
  } else {
    // Streak broken
    newStreak = 1;
    graceUsedAt = null;
  }

  const longest = Math.max(newStreak, existing.longestStreak);
  const milestonesHit = checkMilestones(newStreak, STREAK_MILESTONES, existing.milestoneHits);

  await prisma.contributorStreak.update({
    where: { id: existing.id },
    data: {
      currentStreak: newStreak,
      longestStreak: longest,
      lastActivityAt: now,
      graceUsedAt,
      ...(milestonesHit.length ? { milestoneHits: { push: milestonesHit } } : {}),
    },
  });

  if (milestonesHit.length) {
    await logActivity(userId, "STREAK_MILESTONE", existing.id, {
      streakType: activityType,
      milestones: milestonesHit,
      streak: newStreak,
    });
  }

  return { streak: newStreak, isNew: false, milestonesHit };
}

function checkMilestones(
  currentStreak: number,
  milestones: number[],
  alreadyHit: number[],
): number[] {
  return milestones.filter((m) => currentStreak >= m && !alreadyHit.includes(m));
}

export async function getUserStreaks(userId: string) {
  return prisma.contributorStreak.findMany({
    where: { userId },
    orderBy: { activityType: "asc" },
  });
}

export async function applyStreakFreeze(
  userId: string,
  activityType: StreakType,
): Promise<{ ok: boolean; freezesLeft: number }> {
  const streak = await prisma.contributorStreak.findUnique({
    where: { userId_activityType: { userId, activityType } },
  });

  if (!streak || streak.freezesLeft <= 0) {
    return { ok: false, freezesLeft: streak?.freezesLeft ?? 0 };
  }

  await prisma.contributorStreak.update({
    where: { id: streak.id },
    data: { freezesLeft: { decrement: 1 }, graceUsedAt: new Date() },
  });

  return { ok: true, freezesLeft: streak.freezesLeft - 1 };
}

export async function awardStreakFreeze(userId: string, activityType: StreakType, count = 1) {
  await prisma.contributorStreak.upsert({
    where: { userId_activityType: { userId, activityType } },
    create: { userId, activityType, freezesLeft: count },
    update: { freezesLeft: { increment: count } },
  });
}
