import { prisma } from "@/lib/db/prisma";
import { MissionType, MissionStatus } from "@prisma/client";
import { logActivity } from "./activity-feed";
import { checkAndAwardBadges } from "./badges";

export async function getActiveMissions(opts?: {
  region?: string;
  topic?: string;
  type?: MissionType;
}) {
  return prisma.mission.findMany({
    where: {
      status: "ACTIVE",
      endsAt: { gte: new Date() },
      ...(opts?.region ? { region: opts.region } : {}),
      ...(opts?.topic ? { topic: opts.topic } : {}),
      ...(opts?.type ? { type: opts.type } : {}),
    },
    include: {
      _count: { select: { participants: true } },
    },
    orderBy: { endsAt: "asc" },
  });
}

export async function joinMission(
  userId: string,
  missionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) return { ok: false, error: "Mission not found" };
  if (mission.status !== "ACTIVE") return { ok: false, error: "Mission not active" };
  if (mission.endsAt < new Date()) return { ok: false, error: "Mission ended" };

  await prisma.missionParticipant.upsert({
    where: { missionId_userId: { missionId, userId } },
    create: { missionId, userId },
    update: {},
  });

  await logActivity(userId, "MISSION_JOINED", missionId, { missionTitle: mission.title });
  return { ok: true };
}

export async function recordMissionContribution(
  missionId: string,
  contributionId: string,
  userId: string,
): Promise<void> {
  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission || mission.status !== "ACTIVE") return;

  await prisma.missionContribution.upsert({
    where: { missionId_contributionId: { missionId, contributionId } },
    create: { missionId, contributionId, userId },
    update: {},
  });

  // Increment participant progress
  await prisma.missionParticipant.upsert({
    where: { missionId_userId: { missionId, userId } },
    create: { missionId, userId, progress: 1 },
    update: { progress: { increment: 1 } },
  });

  // Update mission total
  const total = await prisma.missionContribution.count({ where: { missionId } });
  await prisma.mission.update({
    where: { id: missionId },
    data: { currentCount: total },
  });

  if (total >= mission.targetCount) {
    await completeMission(missionId);
  }
}

async function completeMission(missionId: string): Promise<void> {
  await prisma.mission.update({
    where: { id: missionId },
    data: { status: "COMPLETED" },
  });

  const participants = await prisma.missionParticipant.findMany({
    where: { missionId, completedAt: null },
  });

  for (const p of participants) {
    await prisma.missionParticipant.update({
      where: { id: p.id },
      data: { completedAt: new Date() },
    });
    await logActivity(p.userId, "MISSION_COMPLETED", missionId);
    await checkAndAwardBadges(p.userId);
  }
}

export async function getMissionWithProgress(missionId: string) {
  return prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      participants: {
        include: { user: { select: { username: true, displayName: true, avatar: true } } },
        orderBy: { progress: "desc" },
        take: 10,
      },
      _count: { select: { participants: true, contributions: true } },
    },
  });
}

export async function createMission(data: {
  title: string;
  description: string;
  type: MissionType;
  targetCount: number;
  endsAt: Date;
  region?: string;
  topic?: string;
  rewardPoints?: number;
  createdBy?: string;
}) {
  return prisma.mission.create({ data });
}
