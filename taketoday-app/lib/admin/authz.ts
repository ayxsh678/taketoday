import { auth } from "@/auth";
import { jsonError } from "@/lib/admin/api";
import { hasPermission } from "@/lib/admin/rbac";
import type { AdminPermission } from "@/lib/admin/types";

export async function requireAdmin(permission?: AdminPermission) {
  const session = await auth();
  if (!session?.user?.isAdmin) return { ok: false as const, response: jsonError("Unauthorized", 401) };
  if (permission && !hasPermission(session.user.role, permission)) {
    return { ok: false as const, response: jsonError("Forbidden", 403) };
  }
  return { ok: true as const, session };
}
