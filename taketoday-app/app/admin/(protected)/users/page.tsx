import { adminUsers } from "@/lib/admin/data";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <ModulePage moduleKey="users" />
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Invite, assign roles, revoke access, and inspect session activity.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {adminUsers.map((user) => (
            <div key={user.id} className="rounded-md border border-white/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
                </div>
                <Badge tone={user.status === "active" ? "green" : "amber"}>{user.status}</Badge>
              </div>
              <p className="mt-4 text-sm text-zinc-300">{user.role}</p>
              <p className="mt-1 text-xs text-zinc-500">Last active: {user.lastActive}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
