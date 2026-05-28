import { prisma } from "@/lib/db/prisma";
import { ActivityType } from "@prisma/client";
import type { InputJsonObject } from "@prisma/client/runtime/library";

export async function logActivity(
  userId: string,
  type: ActivityType,
  targetId?: string,
  metadata?: Record<string, unknown>,
  isPublic = true,
): Promise<void> {
  await prisma.contributorActivity.create({
    data: {
      userId,
      type,
      targetId,
      targetType: targetId ? inferTargetType(type) : undefined,
      metadata: metadata as InputJsonObject | undefined,
      isPublic,
    },
  });
}

function inferTargetType(type: ActivityType): string {
  switch (type) {
    case "CONTRIBUTION_PUBLISHED":
    case "FACT_CHECK_COMPLETED":
    case "EVIDENCE_SUBMITTED":
    case "NOTE_PROMOTED":
    case "CORRECTION_ISSUED":
      return "contribution";
    case "BADGE_EARNED":
      return "badge";
    case "STREAK_MILESTONE":
      return "streak";
    case "MISSION_JOINED":
    case "MISSION_COMPLETED":
      return "mission";
    case "INVESTIGATION_JOINED":
      return "investigation";
    default:
      return "unknown";
  }
}

export async function getActivityFeed(opts: {
  userId?: string;
  limit?: number;
  cursor?: string;
  publicOnly?: boolean;
}) {
  const { userId, limit = 20, cursor, publicOnly = true } = opts;

  return prisma.contributorActivity.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(publicOnly ? { isPublic: true } : {}),
    },
    include: {
      user: { select: { username: true, displayName: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
}
