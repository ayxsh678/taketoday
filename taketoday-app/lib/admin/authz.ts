import { auth } from "@/auth";
import { jsonError } from "@/lib/admin/api";
import { hasPermission } from "@/lib/admin/rbac";
import { checkRateLimit } from "@/lib/rate-limit";
import type { AdminPermission } from "@/lib/admin/types";

export async function requireAdmin(permission?: AdminPermission) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return { ok: false as const, response: jsonError("Unauthorized", 401) };
  }

  const identifier = session.user.id ?? session.user.email ?? "unknown";
  const limited = await checkRateLimit(identifier, session.user.role);
  if (limited) {
    return { ok: false as const, response: jsonError("Rate limit exceeded. Please try again later.", 429) };
  }

  if (permission && !hasPermission(session.user.role, permission)) {
    return { ok: false as const, response: jsonError("Forbidden", 403) };
  }

  return { ok: true as const, session };
}
