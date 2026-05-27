import { auth } from "@/auth";
import { jsonError } from "@/lib/admin/api";
import { hasPermission } from "@/lib/admin/rbac";
import type { AdminPermission } from "@/lib/admin/types";
import { prisma } from "@/lib/db/prisma";

// ─── lastActiveAt heartbeat ───────────────────────────────────────────────────
// Fire-and-forget — doesn't block the request. Throttled to once per minute
// using a module-level Set to avoid hammering the DB on every API call.

const recentlyUpdated = new Set<string>();

function touchLastActive(userId: string): void {
  if (recentlyUpdated.has(userId)) return;
  recentlyUpdated.add(userId);
  setTimeout(() => recentlyUpdated.delete(userId), 60_000);

  // Async, not awaited — failure is silent
  void Promise.resolve(
    prisma.adminUser.updateMany({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    }),
  ).catch(() => {
    /* ignore */
  });
}

// ─── Permission gate ──────────────────────────────────────────────────────────

export async function requireAdmin(permission?: AdminPermission) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return { ok: false as const, response: jsonError("Unauthorized", 401) };
  }

  if (permission && !hasPermission(session.user.role, permission)) {
    return { ok: false as const, response: jsonError("Forbidden", 403) };
  }

  // Heartbeat — update lastActiveAt at most once per minute per user
  if (session.user.id) {
    touchLastActive(session.user.id);
  }

  return { ok: true as const, session };
}
