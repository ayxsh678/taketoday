"use client";

import { useEffect, useState } from "react";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function UsersPage() {
  const [users, setUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    lastActive: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!newUserEmail.trim() || !newUserRole.trim()) {
      alert("Please provide both email and role");
      return;
    }

    setIsInviting(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUserEmail,
          role: newUserRole,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add the new user to our list
      setUsers(prev => [
        ...prev,
        {
          id: data.invitationId || `user_${Date.now()}`,
          name: data.email.split('@')[0], // Extract name from email
          email: data.email,
          role: data.role,
          status: data.status,
          lastActive: "Pending",
        }
      ]);
      
      // Clear the form
      setNewUserEmail("");
      setNewUserRole("");
    } catch (err) {
      console.error("Failed to invite user:", err);
      alert("Failed to invite user. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ModulePage moduleKey="users" />
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Invite, assign roles, revoke access, and inspect session activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Invite user form */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Email
                </label>
                <Input
                  className="mt-2"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Enter user email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Role
                </label>
                <Input
                  className="mt-2"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  placeholder="Enter user role"
                />
              </div>
              <div className="col-span-2">
                <Button onClick={handleInviteUser} disabled={isInviting}>
                  {isInviting ? "Inviting..." : "Invite User"}
                </Button>
              </div>
            </div>
            
            {/* Users grid */}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {loading ? (
                <div className="col-span-3 text-center py-8 text-zinc-400">
                  Loading users...
                </div>
              ) : error ? (
                <div className="col-span-3 text-center py-8 text-red-400">
                  {error}
                </div>
              ) : users.length === 0 ? (
                <div className="col-span-3 text-center py-8 text-zinc-400">
                  No users found
                </div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="rounded-md border border-white/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
                      </div>
                      <Badge tone={user.status === "active" ? "green" : "amber"}>
                        {user.status}
                      </Badge>
                    </div>
                    <p className="mt-4 text-sm text-zinc-300">{user.role}</p>
                    <p className="mt-1 text-xs text-zinc-500">Last active: {user.lastActive}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
