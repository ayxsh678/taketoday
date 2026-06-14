import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string; sid: string }> };

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  try {
    const { id, sid } = await params;
    const source = await prisma.articleSource.findFirst({
      where: { id: sid, articleId: id },
    });
    if (!source) return jsonError("Source not found", 404);

    await prisma.articleSource.delete({ where: { id: sid } });
    return jsonOk({ message: "Source removed" });
  } catch (error) {
    return captureApiError(error);
  }
}
