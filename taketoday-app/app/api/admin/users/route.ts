import { NextRequest } from "next/server";
import { z } from "zod";
import { ADMIN_ROLES } from "@/lib/admin/types";
import { jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(ADMIN_ROLES),
});

const roleMap: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  EDITOR: "Editor",
  CONTENT_MANAGER: "Content Manager",
  SOCIAL_MEDIA_MANAGER: "Social Media Manager",
  ANALYST: "Analyst",
};

export async function GET(request: NextRequest) {
  // Check rate limit
  if (rateLimit(request)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("users:manage");
  if (!access.ok) return access.response;

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const mappedUsers = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: roleMap[user.role] || "Analyst",
    status: user.revokedAt ? "suspended" : "active",
    lastActive: user.lastActiveAt ? user.lastActiveAt.toISOString() : "Never",
  }));

  return jsonOk({ users: mappedUsers });
}

export async function POST(req: NextRequest) {
  // Check rate limit
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("users:manage");
  if (!access.ok) return access.response;

  const parsed = inviteSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.message, 422);
  return jsonOk({ invitationId: `inv_${Date.now()}`, ...parsed.data, status: "invited" }, { status: 201 });
}
