"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const registered = params.get("registered") === "1";
  const reset = params.get("reset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // next-auth credentials sign-in via the contributor auth instance
      const { signIn } = await import("next-auth/react");
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/contribute",
      });
      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }
      router.push("/contribute");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {registered && (
        <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Account created. Check your inbox to verify your email, then sign in.
        </div>
      )}
      {reset && (
        <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Password updated. You can now sign in with your new password.
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-ink-200 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-400 focus:outline-none focus:ring-1 focus:ring-ink"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sm font-medium text-ink-700">Password</label>
            <Link href="/contribute/forgot-password" className="text-xs text-ink-400 hover:text-ink">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-ink-200 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-400 focus:outline-none focus:ring-1 focus:ring-ink"
            placeholder="Your password"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ink text-paper px-6 py-2.5 text-sm font-medium hover:bg-ink-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-6 relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-ink-200" />
        </div>
        <div className="relative flex justify-center text-xs text-ink-400">
          <span className="bg-paper px-2">or</span>
        </div>
      </div>

      <button
        onClick={() => void import("next-auth/react").then(({ signIn }) => signIn("google", { callbackUrl: "/contribute" }))}
        className="mt-4 w-full rounded-full border border-ink-200 px-6 py-2.5 text-sm font-medium text-ink hover:border-ink transition-colors"
      >
        Continue with Google
      </button>
    </>
  );
}

export default function ContributorLoginPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="font-serif text-3xl italic tracking-tight text-ink">Sign in</h1>
      <p className="mt-2 text-[15px] text-ink-500">
        Access your contributor account.
      </p>

      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-ink-400">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-8 text-center text-sm text-ink-400">
        No account?{" "}
        <Link href="/contribute/register" className="text-ink hover:underline">
          Register as contributor
        </Link>
      </p>
    </main>
  );
}
