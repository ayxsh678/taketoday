import { describe, it, expect, vi, beforeEach } from "vitest";

const mockConfig = vi.hoisted(() => ({
  adminEmails: [] as string[],
  adminSuperAdmins: [] as string[],
  adminEditors: [] as string[],
  adminContentManagers: [] as string[],
  adminSocialManagers: [] as string[],
}));

vi.mock("@/lib/config/app", () => ({
  appConfig: mockConfig,
}));

import { isAdminEmail, roleFromEmail } from "@/lib/admin/rbac";

describe("isAdminEmail [SEC-03 regression]", () => {
  beforeEach(() => {
    mockConfig.adminEmails = [];
    mockConfig.adminSuperAdmins = [];
    mockConfig.adminEditors = [];
    mockConfig.adminContentManagers = [];
    mockConfig.adminSocialManagers = [];
  });

  it("fails closed: returns false for any email when ADMIN_EMAILS is empty", () => {
    expect(isAdminEmail("anygoogleuser@gmail.com")).toBe(false);
    expect(isAdminEmail("admin@example.com")).toBe(false);
    expect(isAdminEmail("root@localhost")).toBe(false);
  });

  it("fails closed: returns false for null/undefined when allowlist is empty", () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it("allows email present in explicit allowlist", () => {
    mockConfig.adminEmails = ["admin@example.com"];
    expect(isAdminEmail("admin@example.com")).toBe(true);
  });

  it("matches case-insensitively", () => {
    mockConfig.adminEmails = ["admin@example.com"];
    expect(isAdminEmail("ADMIN@EXAMPLE.COM")).toBe(true);
    expect(isAdminEmail("Admin@Example.Com")).toBe(true);
  });

  it("denies email not in allowlist", () => {
    mockConfig.adminEmails = ["admin@example.com"];
    expect(isAdminEmail("other@example.com")).toBe(false);
  });

  it("denies null/undefined even with non-empty allowlist", () => {
    mockConfig.adminEmails = ["admin@example.com"];
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });
});

describe("roleFromEmail", () => {
  beforeEach(() => {
    mockConfig.adminEmails = [];
    mockConfig.adminSuperAdmins = [];
    mockConfig.adminEditors = [];
    mockConfig.adminContentManagers = [];
    mockConfig.adminSocialManagers = [];
  });

  it("returns Analyst when no role lists are set", () => {
    expect(roleFromEmail("anyone@example.com")).toBe("Analyst");
  });

  it("returns Super Admin for super admin email", () => {
    mockConfig.adminSuperAdmins = ["superadmin@example.com"];
    expect(roleFromEmail("superadmin@example.com")).toBe("Super Admin");
  });

  it("returns Editor for editor email", () => {
    mockConfig.adminEditors = ["editor@example.com"];
    expect(roleFromEmail("editor@example.com")).toBe("Editor");
  });

  it("returns Analyst for null/undefined email", () => {
    expect(roleFromEmail(null)).toBe("Analyst");
    expect(roleFromEmail(undefined)).toBe("Analyst");
  });
});
