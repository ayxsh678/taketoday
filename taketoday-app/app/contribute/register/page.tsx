"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FormState {
  email: string;
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
}

export default function ContributorRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    email: "",
    username: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contributor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          username: form.username,
          displayName: form.displayName,
          password: form.password,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }

      router.push("/contribute/login?registered=1");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/contribute" className="text-sm text-ink/50 hover:text-ink/70 mb-4 block">
            ← Contribute
          </Link>
          <h1 className="font-instrument text-3xl text-ink mb-2">Join TakeToday</h1>
          <p className="text-ink/60 text-sm">Create your contributor account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Display Name</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={60}
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="Your full name or pseudonym"
              className="w-full border border-ink/20 rounded-lg px-4 py-2.5 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/50 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Username</label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={30}
              pattern="^[a-z0-9_-]+$"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))}
              placeholder="your_username"
              className="w-full border border-ink/20 rounded-lg px-4 py-2.5 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/50 text-sm font-mono"
            />
            <p className="text-xs text-ink/40 mt-1">Lowercase letters, numbers, _ and - only</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full border border-ink/20 rounded-lg px-4 py-2.5 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/50 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="8+ characters"
              className="w-full border border-ink/20 rounded-lg px-4 py-2.5 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/50 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Repeat password"
              className="w-full border border-ink/20 rounded-lg px-4 py-2.5 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/50 text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-paper py-3 rounded-lg font-medium text-sm hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-ink/50 mt-6">
          Already have an account?{" "}
          <Link href="/contribute/login" className="text-ink hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
