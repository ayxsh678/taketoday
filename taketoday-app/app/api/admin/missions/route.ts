import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/admin/authz";
import { jsonOk, jsonError, captureApiError } from "@/lib/admin/api";
import { logAuditAction } from "@/lib/admin/audit";
import { getOrCreateAdminUser } from "@/lib/admin/current-user";
import { MissionDifficulty, MissionStatus } from "@prisma/client";
import { POINTS_BY_DIFFICULTY } from "@/lib/missions";

const missionCreateSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  category: z.string().min(2).max(50),
  difficulty: z.nativeEnum(MissionDifficulty),
  deadline: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 20;

    const where = status ? { status: status as MissionStatus } : {};

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: { select: { name: true, email: true } },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.mission.count({ where }),
    ]);

    return jsonOk({ missions, total, page, limit });
  } catch (err) {
    return captureApiError(err);
  }
}

export async function POST(req: NextRequest) {
  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  try {
    const body = await req.json();
    const parsed = missionCreateSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

    const admin = await getOrCreateAdminUser(access.session);
    const { difficulty, ...rest } = parsed.data;

    const mission = await prisma.mission.create({
      data: {
        ...rest,
        difficulty,
        pointsReward: POINTS_BY_DIFFICULTY[difficulty],
        createdById: admin?.id,
        deadline: rest.deadline ? new Date(rest.deadline) : undefined,
      },
    });

    await logAuditAction({
      action: "MISSION_CREATED",
      entity: "Mission",
      entityId: mission.id,
      after: { title: mission.title, difficulty, pointsReward: mission.pointsReward },
    });

    return jsonOk({ mission }, { status: 201 });
  } catch (err) {
    return captureApiError(err);
  }
}
