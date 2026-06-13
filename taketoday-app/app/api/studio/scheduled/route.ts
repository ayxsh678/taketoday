import { NextRequest } from "next/server";
import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const access = await requireAdmin("social:write");
  if (!access.ok) return access.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;

  try {
    const posts = await prisma.scheduledPost.findMany({
      where: status ? { status: status as "PENDING" | "POSTED" | "FAILED" } : {},
      include: { draft: { select: { topic: true, type: true } } },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
      take: 200,
    });
    return jsonOk({ posts });
  } catch (error) {
    return captureApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  const access = await requireAdmin("social:write");
  if (!access.ok) return access.response;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonError("Missing id", 400);

  try {
    const post = await prisma.scheduledPost.findUnique({ where: { id } });
    if (!post) return jsonError("Not found", 404);
    if (post.status !== "PENDING") return jsonError("Only PENDING posts can be cancelled", 400);
    await prisma.scheduledPost.delete({ where: { id } });
    return jsonOk({ cancelled: id });
  } catch (error) {
    return captureApiError(error);
  }
}
