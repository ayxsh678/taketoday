"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <p className="text-sm text-red-500">
        Invalid reset link. <Link href="/contribute/forgot-password" className="underline">Request a new one.</Link>
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/contributor/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Reset failed"); return; }
      router.push("/contribute/login?reset=1");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink-700 mb-1.5">
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-ink-200 bg-transparent px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
          placeholder="Minimum 8 characters"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-ink-700 mb-1.5">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-md border border-ink-200 bg-transparent px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
          placeholder="Repeat password"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-ink text-paper px-6 py-2.5 text-sm font-medium hover:bg-ink-700 disabled:opacity-60 transition-colors"
      >
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="font-serif text-3xl italic tracking-tight text-ink">Set new password</h1>
      <p className="mt-3 text-[15px] text-ink-500">Choose a new password for your account.</p>
      <Suspense fallback={<p className="mt-8 text-sm text-ink-400">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
