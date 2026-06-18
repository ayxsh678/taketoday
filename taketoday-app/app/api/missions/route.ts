import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, captureApiError } from "@/lib/admin/api";
import { MissionStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 12;

    const where = {
      status: { in: [MissionStatus.OPEN, MissionStatus.IN_PROGRESS] as MissionStatus[] },
      ...(category ? { category } : {}),
      ...(difficulty ? { difficulty: difficulty as never } : {}),
    };

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        where,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
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
