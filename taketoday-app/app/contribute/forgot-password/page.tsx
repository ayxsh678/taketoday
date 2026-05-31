"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contributor/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Request failed"); return; }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-serif text-3xl italic tracking-tight text-ink">Check your inbox</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-500">
          If <strong>{email}</strong> is registered, you&apos;ll receive a reset link within a few minutes.
          The link expires in 1 hour.
        </p>
        <Link href="/contribute/login" className="mt-8 inline-block text-sm text-ink-500 hover:text-ink underline">
          Back to sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="font-serif text-3xl italic tracking-tight text-ink">Reset password</h1>
      <p className="mt-3 text-[15px] text-ink-500">Enter your email and we&apos;ll send a reset link.</p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink-700 mb-1.5">
            Email
          </label>
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

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ink text-paper px-6 py-2.5 text-sm font-medium hover:bg-ink-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-400">
        Remember it?{" "}
        <Link href="/contribute/login" className="text-ink hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
