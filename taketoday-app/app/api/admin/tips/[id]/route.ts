import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/admin/authz";
import { jsonOk, jsonError, captureApiError } from "@/lib/admin/api";
import { logAuditAction } from "@/lib/admin/audit";
import { TipStatus } from "@prisma/client";

const tipPatchSchema = z.object({
  status: z.nativeEnum(TipStatus).optional(),
  assignedEditor: z.string().max(200).nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const tip = await prisma.storyTip.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: "desc" },
          include: { editor: { select: { name: true, email: true } } },
        },
        investigation: true,
      },
    });
    if (!tip) return jsonError("Tip not found", 404);
    return jsonOk({ tip });
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
    const existing = await prisma.storyTip.findUnique({ where: { id } });
    if (!existing) return jsonError("Tip not found", 404);

    const body = await req.json();
    const parsed = tipPatchSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

    const updated = await prisma.storyTip.update({
      where: { id },
      data: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.assignedEditor !== undefined
          ? { assignedEditor: parsed.data.assignedEditor }
          : {}),
      },
    });

    await logAuditAction({
      action: "TIP_UPDATED",
      entity: "StoryTip",
      entityId: id,
      before: { status: existing.status },
      after: { status: updated.status },
    });

    return jsonOk({ tip: updated });
  } catch (err) {
    return captureApiError(err);
  }
}
