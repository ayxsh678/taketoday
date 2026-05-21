import { auth } from "@/auth";
import { AdminProviders } from "@/components/admin/AdminProviders";
import { AdminShell } from "@/components/admin/AdminShell";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.isAdmin) redirect("/admin/login");
  
  // Check for 2FA verification - redirect if not verified
  // In a real implementation, this would check a two_fa_verified flag in the session
  // For now, we'll simulate this by checking if there's a 2FA token in localStorage (client-side check would be better)
  // But since this is server-side, we'll check if the session has a 2FA verified flag
  // For demo purposes, we'll assume 2FA is not required unless specified in environment
  const is2FaRequired = process.env.NEXT_PUBLIC_REQUIRE_2FA === "true";
  const is2FaVerified = session?.user?.twoFaVerified ?? !is2FaRequired; // If 2FA not required, consider it verified
  
  if (is2FaRequired && !is2FaVerified) {
    redirect("/admin/verify-2fa");
  }

  return (
    <AdminProviders>
      <AdminShell role={session.user.role} name={session.user.name ?? "Admin}">
        {children}
      </AdminShell>
    </AdminProviders>
  );
}
