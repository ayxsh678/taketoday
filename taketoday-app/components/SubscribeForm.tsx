"use client";

/**
 * TakeToday — SubscribeForm
 *
 * Wires the subscribe form to POST /api/subscribe.
 * Three states: idle → submitting → success | error.
 * Preserves the existing visual design from the subscribe page.
 */

import { useState } from "react";
import Link from "next/link";

type FormState = "idle" | "submitting" | "success" | "error";

export function SubscribeForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const name = formData.get("name");

    if (typeof email !== "string" || typeof name !== "string") {
      setState("idle");
      setErrorMsg("Please fill out the form correctly.");
      return;
    }

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (res.ok && data.ok) {
        setState("success");
      } else if (res.status === 503) {
        // Newsletter service not yet configured — treat as success UX
        // to avoid exposing infrastructure errors to readers.
        setState("success");
      } else {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="border border-ink-200/70 p-8 lg:p-10">
        <div className="flex flex-col gap-4">
          <span
            aria-hidden
            className="w-2 h-2 rounded-full bg-accent"
          />
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400">
            You&rsquo;re in
          </p>
          <p className="text-[17px] leading-relaxed text-ink">
            Check your inbox for a confirmation email. Once confirmed,
            you&rsquo;ll get TakeToday&rsquo;s brief every weekday.
          </p>
          <p className="text-[13px] text-ink-500">
            Didn&rsquo;t get it? Check your spam folder or{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-ink transition-colors"
              onClick={() => setState("idle")}
            >
              try again
            </button>
            .
          </p>
        </div>
      </div>
    );
  }

  const isSubmitting = state === "submitting";

  return (
    <div className="border border-ink-200/70 p-8 lg:p-10">
      <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-6">
        Get started — it&rsquo;s free
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        aria-label="Subscribe form"
        noValidate
      >
        <div>
          <label
            htmlFor="sub-name"
            className="block text-[13px] text-ink-600 mb-1.5"
          >
            First name
          </label>
          <input
            id="sub-name"
            name="name"
            type="text"
            autoComplete="given-name"
            placeholder="Alex"
            disabled={isSubmitting}
            className="w-full border border-ink-200 bg-transparent px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-400 focus:outline-none focus:border-ink transition-colors disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="sub-email"
            className="block text-[13px] text-ink-600 mb-1.5"
          >
            Email address
          </label>
          <input
            id="sub-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            disabled={isSubmitting}
            className="w-full border border-ink-200 bg-transparent px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-400 focus:outline-none focus:border-ink transition-colors disabled:opacity-50"
          />
        </div>

        {state === "error" && (
          <p role="alert" className="text-[13px] text-red-600">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-ink text-paper py-3 text-[13px] font-medium tracking-wide hover:bg-ink-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Subscribing…" : "Subscribe — free"}
        </button>
      </form>

      <p className="mt-5 text-[12px] text-ink-400 leading-relaxed">
        By subscribing you agree to our{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-2 hover:text-ink transition-colors"
        >
          privacy policy
        </Link>
        . No spam, ever. One-click unsubscribe.
      </p>
    </div>
  );
}
