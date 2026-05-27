import { NextRequest } from "next/server";
import { z } from "zod";
import { AdminRole } from "@prisma/client";
import { ADMIN_ROLES } from "@/lib/admin/types";
import { captureApiError, jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

// ── role name mappings ────────────────────────────────────────────────────────

/** Display name → Prisma enum */
const displayToEnum: Record<string, AdminRole> = {
  "Super Admin": AdminRole.SUPER_ADMIN,
  Editor: AdminRole.EDITOR,
  "Content Manager": AdminRole.CONTENT_MANAGER,
  "Social Media Manager": AdminRole.SOCIAL_MEDIA_MANAGER,
  Analyst: AdminRole.ANALYST,
};

/** Prisma enum → display name */
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

// ── schemas ───────────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(ADMIN_ROLES).default("Analyst"),
  name: z.string().min(1).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (rateLimit(request)) return jsonError("Rate limit exceeded. Please try again later.", 429);

  const access = await requireAdmin("users:manage");
  if (!access.ok) return access.response;

  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "desc" } });

  return jsonOk({ users: users.map(mapUser), total: users.length });
}

export async function POST(req: NextRequest) {
  if (rateLimit(req)) return jsonError("Rate limit exceeded. Please try again later.", 429);

  const access = await requireAdmin("users:manage");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const { email, role, name } = parsed.data;
  const prismaRole = displayToEnum[role] ?? AdminRole.ANALYST;

  // Derive name from email if not provided
  const displayName = name?.trim() || email.split("@")[0];

  try {
    const user = await prisma.adminUser.upsert({
      where: { email },
      update: { role: prismaRole },
      create: {
        email,
        name: displayName,
        role: prismaRole,
      },
    });

    return jsonOk({ user: mapUser(user) }, { status: 201 });
  } catch (error) {
    const { code } = error as { code?: string };
    if (code === "P2002") return jsonError("A user with this email already exists.", 409);
    return captureApiError(error);
  }
}
