import { contributorAuthFn } from "./auth";
import { hasContributorPermission } from "./rbac";
import { jsonError } from "@/lib/admin/api";
import { prisma } from "@/lib/db/prisma";
import type { ContributorPermission } from "./types";

export async function requireContributor(permission?: ContributorPermission) {
  const session = await contributorAuthFn();

  if (!session?.contributor) {
    return { ok: false as const, response: jsonError("Unauthorized", 401) };
  }

  // JWT suspendedAt is stale — re-validate from DB on every request so
  // suspensions take effect immediately regardless of token age. [SEC-05 / BUG-11]
  const dbUser = await prisma.publicUser.findUnique({
    where: { id: session.contributor.id },
    select: { suspendedAt: true },
  });
  if (dbUser?.suspendedAt) {
    return { ok: false as const, response: jsonError("Account suspended", 403) };
  }

  if (
    permission &&
    !hasContributorPermission(session.contributor.role, permission)
  ) {
    return { ok: false as const, response: jsonError("Forbidden", 403) };
  }

  return { ok: true as const, session: session.contributor };
}
