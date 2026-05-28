import { contributorAuthFn } from "./auth";
import { hasContributorPermission } from "./rbac";
import { jsonError } from "@/lib/admin/api";
import type { ContributorPermission } from "./types";

export async function requireContributor(permission?: ContributorPermission) {
  const session = await contributorAuthFn();

  if (!session?.contributor) {
    return { ok: false as const, response: jsonError("Unauthorized", 401) };
  }

  if (session.contributor.suspendedAt) {
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
