"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, UserPlus, X } from "lucide-react";
import { ADMIN_ROLES } from "@/lib/admin/types";
import type { AdminRole } from "@/lib/admin/types";

// ─── types ────────────────────────────────────────────────────────────────────

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "suspended";
  lastActive: string | null;
  createdAt: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const statusTone = {
  active: "green",
  suspended: "red",
} as const;

function RoleSelect({
  value,
  onChange,
}: {
  value: AdminRole;
  onChange: (v: AdminRole) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AdminRole)}
        className="h-8 w-full appearance-none rounded-md border border-white/10 bg-zinc-900 px-3 pr-8 text-sm text-white outline-none transition focus:border-white/25"
      >
        {ADMIN_ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-zinc-400" />
    </div>
  );
}

function formatLastActive(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

// ─── component ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("Analyst");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // revoke/restore inline confirm
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // role editing
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleValue, setEditingRoleValue] = useState<AdminRole>("Analyst");
  const [isSavingRole, setIsSavingRole] = useState(false);

  // ── fetch ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    void fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { ok: boolean; data: { users: AdminUserRow[] } };
      setUsers(json.data.users ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // ── invite ───────────────────────────────────────────────────────────────────

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const json = await res.json() as { ok: boolean; data?: { user: AdminUserRow }; error?: string };
      if (!res.ok) {
        setInviteError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      const newUser = json.data!.user;
      setUsers((prev) => {
        // upsert — if user already existed, replace
        const exists = prev.some((u) => u.id === newUser.id);
        return exists
          ? prev.map((u) => (u.id === newUser.id ? newUser : u))
          : [newUser, ...prev];
      });
      setInviteEmail("");
      setInviteRole("Analyst");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setIsInviting(false);
    }
  };

  // ── revoke / restore ─────────────────────────────────────────────────────────

  const handleRevoke = async (userId: string, revoke: boolean) => {
    setIsRevoking(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revoke }),
      });
      const json = await res.json() as { ok: boolean; data?: { user: AdminUserRow }; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Action failed");
        return;
      }
      const updated = json.data!.user;
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setRevokingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsRevoking(false);
    }
  };

  // ── role change ──────────────────────────────────────────────────────────────

  const startEditRole = (user: AdminUserRow) => {
    setEditingRoleId(user.id);
    setEditingRoleValue(user.role);
  };

  const handleSaveRole = async (userId: string) => {
    setIsSavingRole(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editingRoleValue }),
      });
      const json = await res.json() as { ok: boolean; data?: { user: AdminUserRow }; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Role update failed");
        return;
      }
      const updated = json.data!.user;
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setEditingRoleId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Role update failed");
    } finally {
      setIsSavingRole(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* ── header ── */}
      <div>
        <Badge tone="blue">Team</Badge>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white lg:text-4xl">
          Team Members
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">
          Invite teammates, assign roles, and manage access across the newsroom.
        </p>
      </div>

      {/* ── invite form ── */}
      <Card>
        <CardHeader>
          <CardTitle>Invite a teammate</CardTitle>
          <CardDescription>
            Creates a user record immediately. They can sign in with this email via Google/OAuth.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleInvite(e)} className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@example.com"
                required
              />
            </div>
            <div className="w-52">
              <div className="relative">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                  className="h-9 w-full appearance-none rounded-md border border-white/10 bg-zinc-900 px-3 pr-8 text-sm text-white outline-none transition focus:border-white/25"
                >
                  {ADMIN_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-zinc-400" />
              </div>
            </div>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? (
                "Inviting…"
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </>
              )}
            </Button>
          </form>
          {inviteError && (
            <p className="mt-3 text-sm text-red-400">{inviteError}</p>
          )}
        </CardContent>
      </Card>

      {/* ── users table ── */}
      <Card>
        <CardHeader>
          <CardTitle>All team members</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${users.length} member${users.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <p className="px-5 py-3 text-sm text-red-400">{error}</p>
          )}
          <div className="overflow-hidden rounded-b-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/4 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Last active</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-zinc-400">
                      Loading team members…
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-zinc-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/3">
                      {/* member */}
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{user.email}</p>
                      </td>

                      {/* role — inline edit */}
                      <td className="px-5 py-4">
                        {editingRoleId === user.id ? (
                          <div className="flex items-center gap-2">
                            <div className="w-44">
                              <RoleSelect
                                value={editingRoleValue}
                                onChange={setEditingRoleValue}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              aria-label="Save role"
                              onClick={() => void handleSaveRole(user.id)}
                              disabled={isSavingRole}
                            >
                              <Check className="h-4 w-4 text-green-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              aria-label="Cancel"
                              onClick={() => setEditingRoleId(null)}
                              disabled={isSavingRole}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            className="group flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white"
                            onClick={() => startEditRole(user)}
                          >
                            {user.role}
                            <ChevronDown className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400" />
                          </button>
                        )}
                      </td>

                      {/* status */}
                      <td className="px-5 py-4">
                        <Badge tone={statusTone[user.status]}>
                          {user.status}
                        </Badge>
                      </td>

                      {/* last active */}
                      <td className="px-5 py-4 text-xs text-zinc-400">
                        {formatLastActive(user.lastActive)}
                      </td>

                      {/* actions */}
                      <td className="px-5 py-4 text-right">
                        {revokingId === user.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-zinc-400">
                              {user.status === "active" ? "Revoke access?" : "Restore access?"}
                            </span>
                            <Button
                              variant={user.status === "active" ? "danger" : "primary"}
                              className="h-7 px-2 text-xs"
                              onClick={() => void handleRevoke(user.id, user.status === "active")}
                              disabled={isRevoking}
                            >
                              {isRevoking ? "…" : "Confirm"}
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => setRevokingId(null)}
                              disabled={isRevoking}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            className={`h-8 px-3 text-xs ${
                              user.status === "active"
                                ? "text-red-400 hover:text-red-300"
                                : "text-green-400 hover:text-green-300"
                            }`}
                            onClick={() => setRevokingId(user.id)}
                          >
                            {user.status === "active" ? "Revoke" : "Restore"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
