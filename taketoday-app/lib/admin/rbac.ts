import type { AdminPermission, AdminRole } from "@/lib/admin/types";

export const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  "Super Admin": [
    "dashboard:read",
    "content:read",
    "content:write",
    "content:publish",
    "ai:run",
    "ingestion:write",
    "media:write",
    "social:write",
    "analytics:read",
    "users:manage",
    "settings:manage",
  ],
  Editor: [
    "dashboard:read",
    "content:read",
    "content:write",
    "content:publish",
    "ai:run",
    "analytics:read",
  ],
  "Content Manager": [
    "dashboard:read",
    "content:read",
    "content:write",
    "ai:run",
    "ingestion:write",
    "media:write",
  ],
  "Social Media Manager": [
    "dashboard:read",
    "content:read",
    "ai:run",
    "social:write",
    "media:write",
    "analytics:read",
  ],
  Analyst: ["dashboard:read", "content:read", "analytics:read"],
};

export function hasPermission(role: AdminRole, permission: AdminPermission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function roleFromEmail(email?: string | null): AdminRole {
  const superAdmins = parseEmailList(process.env.ADMIN_SUPER_ADMINS);
  const editors = parseEmailList(process.env.ADMIN_EDITORS);
  const contentManagers = parseEmailList(process.env.ADMIN_CONTENT_MANAGERS);
  const socialManagers = parseEmailList(process.env.ADMIN_SOCIAL_MANAGERS);

  if (!email) return "Analyst";
  const normalized = email.toLowerCase();
  if (superAdmins.has(normalized)) return "Super Admin";
  if (editors.has(normalized)) return "Editor";
  if (contentManagers.has(normalized)) return "Content Manager";
  if (socialManagers.has(normalized)) return "Social Media Manager";
  return "Analyst";
}

export function isAdminEmail(email?: string | null) {
  const allowlist = parseEmailList(process.env.ADMIN_EMAILS);
  if (allowlist.size === 0) return Boolean(email);
  return email ? allowlist.has(email.toLowerCase()) : false;
}

function parseEmailList(value?: string) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}
