import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/admin/authz";
import { jsonOk, jsonError, captureApiError } from "@/lib/admin/api";
import { getOrCreateAdminUser } from "@/lib/admin/current-user";

const commentSchema = z.object({
  comment: z.string().min(1).max(2000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const tip = await prisma.storyTip.findUnique({ where: { id } });
    if (!tip) return jsonError("Tip not found", 404);

    const body = await req.json();
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

    const admin = await getOrCreateAdminUser(access.session);
    if (!admin) return jsonError("Admin user not found", 404);

    const comment = await prisma.tipComment.create({
      data: {
        tipId: id,
        editorId: admin.id,
        comment: parsed.data.comment,
      },
      include: { editor: { select: { name: true, email: true } } },
    });

    return jsonOk({ comment }, { status: 201 });
  } catch (err) {
    return captureApiError(err);
  }
}
