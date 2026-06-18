import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError, captureApiError } from "@/lib/admin/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const mission = await prisma.mission.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
    });
    if (!mission) return jsonError("Mission not found", 404);
    return jsonOk({ mission });
  } catch (err) {
    return captureApiError(err);
  }
}
