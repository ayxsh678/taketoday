import { auth } from "@/auth";
import { jsonError } from "@/lib/admin/api";
import { hasPermission } from "@/lib/admin/rbac";
import { checkRateLimit } from "@/lib/rate-limit";
import type { AdminPermission } from "@/lib/admin/types";
import { prisma } from "@/lib/db/prisma";
import { isAdminEmail } from "@/lib/admin/rbac";

// ─── lastActiveAt heartbeat ───────────────────────────────────────────────────
// Fire-and-forget — doesn't block the request. Throttled to once per minute
// using a module-level Set. On serverless each cold-start instance gets its
// own Set, so DB writes may be more frequent than 1/min under multiple
// instances — cosmetic concern, not a correctness issue.

const recentlyUpdated = new Set<string>();

function touchLastActive(userId: string): void {
  if (recentlyUpdated.has(userId)) return;
  recentlyUpdated.add(userId);
  setTimeout(() => recentlyUpdated.delete(userId), 60_000);

  void Promise.resolve(
    prisma.adminUser.updateMany({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    }),
  ).catch(() => { /* non-fatal */ });
}

// ─── Permission gate ──────────────────────────────────────────────────────────

export async function requireAdmin(permission?: AdminPermission) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return { ok: false as const, response: jsonError("Unauthorized", 401) };
  }

  // Re-validate revokedAt from DB on every request — catches revocations that
  // occurred after the JWT was issued (JWT TTL is 8h, revocation is immediate). [SEC-05]
  const email = session.user.email ?? "";
  if (email && isAdminEmail(email)) {
    const dbAdmin = await prisma.adminUser.findUnique({
      where: { email },
      select: { revokedAt: true },
    });
    if (dbAdmin?.revokedAt) {
      return { ok: false as const, response: jsonError("Access revoked. Please contact your administrator.", 401) };
    }
  }

  // Role-aware rate limiting backed by Upstash Redis (shared across all
  // serverless instances). Falls back to in-memory when UPSTASH_REDIS_REST_URL
  // is absent. Using user ID as key avoids shared-IP false positives. [BUG-06 / BUG-20]
  const identifier = session.user.id ?? session.user.email ?? "unknown";
  const limited = await checkRateLimit(identifier, session.user.role);
  if (limited) {
    return { ok: false as const, response: jsonError("Rate limit exceeded. Please try again later.", 429) };
  }

  if (permission && !hasPermission(session.user.role, permission)) {
    return { ok: false as const, response: jsonError("Forbidden", 403) };
  }

  if (session.user.id) touchLastActive(session.user.id);

  return { ok: true as const, session };
}
