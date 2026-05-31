import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-white">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">TakeToday Admin</CardTitle>
          <CardDescription>
            Secure editorial access for publishing, AI workflows, analytics, and social distribution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/admin" });
            }}
          >
            <Button type="submit" className="w-full">
              Continue with Google
            </Button>
          </form>
          <p className="mt-4 text-xs leading-5 text-zinc-500">
            Access is restricted by the admin allowlist.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
