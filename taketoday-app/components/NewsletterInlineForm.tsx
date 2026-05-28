"use client";

/**
 * TakeToday — NewsletterInlineForm
 * Compact inline email-only subscribe form used in IntelligenceStrip.
 * Wired to POST /api/subscribe.
 */

import { useState } from "react";

type State = "idle" | "submitting" | "success" | "error";

export function NewsletterInlineForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setError("");

    const email = (new FormData(e.currentTarget).get("email") as string) ?? "";

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok || res.status === 503) {
        setState("success");
      } else {
        setError(data.error ?? "Something went wrong. Try again.");
        setState("error");
      }
    } catch {
      setError("Network error. Check your connection.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden className="w-2 h-2 rounded-full bg-accent shrink-0" />
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-300">
            You&rsquo;re in
          </p>
        </div>
        <p className="text-[15px] leading-relaxed text-ink-300">
          Check your inbox for a confirmation email.
        </p>
      </div>
    );
  }

  const isSubmitting = state === "submitting";

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Subscribe to the Daily Brief"
    >
      <div className="flex items-center gap-2 bg-ink-700 rounded-full p-1 pl-5 ring-1 ring-ink-700/60 focus-within:ring-paper/30 transition">
        <label htmlFor="strip-email" className="sr-only">
          Email address
        </label>
        <input
          id="strip-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@domain.com"
          disabled={isSubmitting}
          className="flex-1 bg-transparent border-0 outline-none text-paper placeholder:text-ink-400 text-[14px] py-3 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="shrink-0 rounded-full bg-paper text-ink px-5 py-2.5 text-[13px] font-medium tracking-wide hover:bg-ink-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "…" : "Subscribe free"}
        </button>
      </div>
      {state === "error" && (
        <p role="alert" className="mt-2 text-[12px] text-red-400">
          {error}
        </p>
      )}
      <p className="mt-4 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400">
        No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}
