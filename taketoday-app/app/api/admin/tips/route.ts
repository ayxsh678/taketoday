import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/admin/authz";
import { jsonOk, captureApiError } from "@/lib/admin/api";
import { TipStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 20;

    const where = {
      ...(status ? { status: status as TipStatus } : {}),
      ...(category ? { category: category as never } : {}),
    };

    const [tips, total] = await Promise.all([
      prisma.storyTip.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { comments: true } },
          investigation: { select: { id: true, status: true } },
        },
      }),
      prisma.storyTip.count({ where }),
    ]);

    return jsonOk({ tips, total, page, limit });
  } catch (err) {
    return captureApiError(err);
  }
}
