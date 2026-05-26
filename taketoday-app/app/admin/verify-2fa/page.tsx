import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyTwoFactorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-white text-zinc-950">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <CardTitle>Two-factor verification required</CardTitle>
          <CardDescription>
            Two-factor enforcement is enabled, but the verification provider is not connected yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-6 text-zinc-400">
            Disable `NEXT_PUBLIC_REQUIRE_2FA` until the OTP provider is configured, or connect the verification flow before inviting admins.
          </p>
          <Link
            href="/admin/login"
            className="inline-flex h-9 w-full items-center justify-center rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/[0.1]"
          >
            Back to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
