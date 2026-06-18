import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/admin/authz";
import { jsonOk, jsonError, captureApiError } from "@/lib/admin/api";
import { logAuditAction } from "@/lib/admin/audit";
import { getOrCreateAdminUser } from "@/lib/admin/current-user";
import { TipStatus } from "@prisma/client";

const investigateSchema = z.object({
  title: z.string().min(5).max(200).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const tip = await prisma.storyTip.findUnique({
      where: { id },
      include: { investigation: true },
    });
    if (!tip) return jsonError("Tip not found", 404);
    if (tip.investigation) return jsonError("Investigation already exists for this tip", 409);

    const body = await req.json().catch(() => ({}));
    const parsed = investigateSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

    const admin = await getOrCreateAdminUser(access.session);

    const [investigation] = await prisma.$transaction([
      prisma.investigation.create({
        data: {
          tipId: id,
          title: parsed.data.title ?? tip.title,
          leadEditorId: admin?.id,
        },
      }),
      prisma.storyTip.update({
        where: { id },
        data: { status: TipStatus.INVESTIGATING },
      }),
    ]);

    await logAuditAction({
      action: "INVESTIGATION_CREATED",
      entity: "Investigation",
      entityId: investigation.id,
      after: { tipId: id, title: investigation.title },
    });

    return jsonOk({ investigation }, { status: 201 });
  } catch (err) {
    return captureApiError(err);
  }
}
