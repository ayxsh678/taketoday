import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/admin/authz";
import { jsonOk, jsonError, captureApiError } from "@/lib/admin/api";
import { SubmissionStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 20;

    const mission = await prisma.mission.findUnique({ where: { id } });
    if (!mission) return jsonError("Mission not found", 404);

    const where = {
      missionId: id,
      ...(status ? { status: status as SubmissionStatus } : {}),
    };

    const [submissions, total] = await Promise.all([
      prisma.missionSubmission.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reviewedBy: { select: { name: true } },
        },
      }),
      prisma.missionSubmission.count({ where }),
    ]);

    return jsonOk({ submissions, total, page, limit, mission });
  } catch (err) {
    return captureApiError(err);
  }
}
