import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { z } from "zod";
import { AdminRole } from "@prisma/client";
import { ADMIN_ROLES } from "@/lib/admin/types";
import { logAuditAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

const displayToEnum: Record<string, AdminRole> = {
  "Super Admin": AdminRole.SUPER_ADMIN,
  Editor: AdminRole.EDITOR,
  "Content Manager": AdminRole.CONTENT_MANAGER,
  "Social Media Manager": AdminRole.SOCIAL_MEDIA_MANAGER,
  Analyst: AdminRole.ANALYST,
};

const enumToDisplay: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  EDITOR: "Editor",
  CONTENT_MANAGER: "Content Manager",
  SOCIAL_MEDIA_MANAGER: "Social Media Manager",
  ANALYST: "Analyst",
};

function mapUser(user: {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  revokedAt: Date | null;
  lastActiveAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: enumToDisplay[user.role] ?? "Analyst",
    status: user.revokedAt ? "suspended" : "active",
    lastActive: user.lastActiveAt ? user.lastActiveAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  };
}

const patchSchema = z.object({
  role: z.enum(ADMIN_ROLES).optional(),
  revoke: z.boolean().optional(), // true = revoke, false = restore
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {

  const access = await requireAdmin("users:manage");
  if (!access.ok) return access.response;

  const { id } = await params;

  const body: unknown = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) return jsonError("User not found", 404);

  // Build update payload
  const updateData: { role?: AdminRole; revokedAt?: Date | null } = {};

  if (parsed.data.role !== undefined) {
    updateData.role = displayToEnum[parsed.data.role] ?? AdminRole.ANALYST;
  }

  if (parsed.data.revoke === true) {
    updateData.revokedAt = new Date();
  } else if (parsed.data.revoke === false) {
    updateData.revokedAt = null;
  }

  if (Object.keys(updateData).length === 0) {
    return jsonError("No valid fields to update", 422);
  }

  try {
    const updated = await prisma.adminUser.update({
      where: { id },
      data: updateData,
    });

    await logAuditAction({
      action: parsed.data.revoke === true ? "revoke_user" : parsed.data.revoke === false ? "restore_user" : "change_role",
      entity: "admin_user",
      entityId: id,
      before: mapUser(existing),
      after: mapUser(updated),
    });

    return jsonOk({ user: mapUser(updated) });
  } catch (error) {
    const { code } = error as { code?: string };
    if (code === "P2025") return jsonError("User not found", 404);
    return captureApiError(error);
  }
}
