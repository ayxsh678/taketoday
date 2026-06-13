"use client";

import Link from "next/link";
import { useState } from "react";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };

    if (data.ok) {
      setStatus("success");
      setEmail("");
      setName("");
    } else {
      setStatus("error");
      setMessage(data.error ?? "Something went wrong. Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-16 lg:pt-24 pb-24">
      <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500">
        <Link href="/" className="reveal hover:text-ink">Home</Link>
        <span aria-hidden className="mx-2 text-ink-300">/</span>
        <span className="text-ink">Subscribe</span>
      </nav>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-16 max-w-5xl">
        <div className="lg:col-span-6">
          <h1 className="font-serif text-[56px] lg:text-[72px] leading-[1.0] tracking-[-0.03em] text-ink">
            Stay sharp.<br />
            <span className="italic text-ink-400">Every morning.</span>
          </h1>
          <p className="mt-6 text-[17px] leading-relaxed text-ink-500 max-w-[52ch]">
            The day&rsquo;s most important stories in AI, finance, tech, and startups — cut down to what actually matters. Free, always.
          </p>

          <ul className="mt-8 space-y-3 text-[14px] text-ink-600">
            {[
              "3-minute daily brief",
              "No ads, no clickbait",
              "Unsubscribe any time",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-ink shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <div className="border border-ink-200/70 p-8">
            {status === "success" ? (
              <div className="py-4">
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-3">Subscribed</p>
                <p className="font-serif text-[28px] leading-tight text-ink">You&rsquo;re in.</p>
                <p className="mt-3 text-[14px] text-ink-500">Check your inbox to confirm. See you tomorrow morning.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-6">
                  Free newsletter
                </p>

                <div>
                  <label htmlFor="name" className="block text-[12px] font-mono uppercase tracking-[0.15em] text-ink-500 mb-2">
                    First name (optional)
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada"
                    className="w-full border border-ink-200/70 bg-transparent px-4 py-3 text-[14px] text-ink placeholder:text-ink-300 focus:outline-none focus:border-ink transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-[12px] font-mono uppercase tracking-[0.15em] text-ink-500 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-ink-200/70 bg-transparent px-4 py-3 text-[14px] text-ink placeholder:text-ink-300 focus:outline-none focus:border-ink transition-colors"
                  />
                </div>

                {status === "error" && (
                  <p className="text-[13px] text-red-600">{message}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-ink text-paper py-3 text-[13px] font-medium tracking-wide hover:bg-ink-700 transition-colors disabled:opacity-50"
                >
                  {status === "loading" ? "Subscribing…" : "Subscribe free →"}
                </button>

                <p className="text-[11px] text-ink-400">
                  No spam. Unsubscribe any time. We use Buttondown.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
