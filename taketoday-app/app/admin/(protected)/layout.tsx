import { auth } from "@/auth";
import { AdminProviders } from "@/components/admin/AdminProviders";
import { AdminShell } from "@/components/admin/AdminShell";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.isAdmin) redirect("/admin/login");

  return (
    <AdminProviders>
      <AdminShell role={session.user.role} name={session.user.name ?? "Admin"}>
        {children}
      </AdminShell>
    </AdminProviders>
  );
}
