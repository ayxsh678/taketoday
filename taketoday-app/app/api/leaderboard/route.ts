import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, captureApiError } from "@/lib/admin/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "25"));

    const contributors = await prisma.contributorPoints.findMany({
      where: { totalPoints: { gt: 0 } },
      orderBy: { totalPoints: "desc" },
      take: limit,
    });

    return jsonOk({ contributors });
  } catch (err) {
    return captureApiError(err);
  }
}
