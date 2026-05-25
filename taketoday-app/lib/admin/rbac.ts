import type { AdminPermission, AdminRole } from "@/lib/admin/types";
import { appConfig } from "@/lib/config/app";

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
  const superAdmins = parseEmailList(appConfig.adminSuperAdmins.join(','));
  const editors = parseEmailList(appConfig.adminEditors.join(','));
  const contentManagers = parseEmailList(appConfig.adminContentManagers.join(','));
  const socialManagers = parseEmailList(appConfig.adminSocialManagers.join(','));

  if (!email) return "Analyst";
  const normalized = email.toLowerCase();
  if (superAdmins.has(normalized)) return "Super Admin";
  if (editors.has(normalized)) return "Editor";
  if (contentManagers.has(normalized)) return "Content Manager";
  if (socialManagers.has(normalized)) return "Social Media Manager";
  return "Analyst";
}

export function isAdminEmail(email?: string | null) {
  const allowlist = parseEmailList(appConfig.adminEmails.join(','));
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
