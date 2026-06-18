import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/admin/authz";
import { jsonOk, jsonError, captureApiError } from "@/lib/admin/api";
import { logAuditAction } from "@/lib/admin/audit";
import { MissionStatus } from "@prisma/client";

const missionPatchSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).optional(),
  category: z.string().min(2).max(50).optional(),
  status: z.nativeEnum(MissionStatus).optional(),
  deadline: z.string().datetime().nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const mission = await prisma.mission.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        _count: { select: { submissions: true } },
      },
    });
    if (!mission) return jsonError("Mission not found", 404);
    return jsonOk({ mission });
  } catch (err) {
    return captureApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const existing = await prisma.mission.findUnique({ where: { id } });
    if (!existing) return jsonError("Mission not found", 404);

    const body = await req.json();
    const parsed = missionPatchSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

    const { deadline, ...rest } = parsed.data;
    const updated = await prisma.mission.update({
      where: { id },
      data: {
        ...rest,
        ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
      },
    });

    await logAuditAction({
      action: "MISSION_UPDATED",
      entity: "Mission",
      entityId: id,
      before: { status: existing.status },
      after: { status: updated.status },
    });

    return jsonOk({ mission: updated });
  } catch (err) {
    return captureApiError(err);
  }
}
