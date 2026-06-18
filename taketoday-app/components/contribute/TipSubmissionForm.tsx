"use client";

import { useState } from "react";
import { TipCategory } from "@prisma/client";

const CATEGORIES: { value: TipCategory; label: string }[] = [
  { value: "AI", label: "AI & Machine Learning" },
  { value: "FINANCE", label: "Finance & Markets" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "STARTUPS", label: "Startups" },
  { value: "CORPORATE_WRONGDOING", label: "Corporate Wrongdoing" },
  { value: "POLICY_REGULATION", label: "Policy & Regulation" },
  { value: "OTHER", label: "Other" },
];

type FormState = "idle" | "submitting" | "success" | "error";

export function TipSubmissionForm() {
  const [form, setForm] = useState({
    title: "",
    summary: "",
    category: "" as TipCategory | "",
    sourceType: "",
    anonymous: false,
    contactEmail: "",
    evidenceLinks: "",
  });
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category) return;
    setState("submitting");
    setErrorMsg("");

    const evidenceLinks = form.evidenceLinks
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          summary: form.summary,
          category: form.category,
          sourceType: form.sourceType || undefined,
          anonymous: form.anonymous,
          contactEmail: form.anonymous ? undefined : form.contactEmail || undefined,
          evidenceLinks,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "Submission failed. Please try again.");
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="border border-ink-200/70 p-8">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-emerald-600 mb-3">
          Tip received
        </p>
        <h3 className="font-serif text-[26px] text-ink mb-3">
          We&rsquo;ll take it from here.
        </h3>
        <p className="text-[15px] text-ink-500 max-w-[52ch] leading-relaxed">
          Your submission has been passed to our editorial team. All tips are
          treated confidentially. If you provided contact details, we may follow
          up for more information.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="tip-title"
          className="block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-500 mb-1.5"
        >
          Headline <span className="text-ink-300">(required)</span>
        </label>
        <input
          id="tip-title"
          type="text"
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="One-line summary of the story"
          className="w-full border border-ink-200/70 bg-transparent px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-300 focus:border-ink focus:outline-none"
        />
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="tip-category"
          className="block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-500 mb-1.5"
        >
          Category <span className="text-ink-300">(required)</span>
        </label>
        <select
          id="tip-category"
          required
          value={form.category}
          onChange={(e) => set("category", e.target.value as TipCategory)}
          className="w-full border border-ink-200/70 bg-transparent px-3 py-2.5 text-[15px] text-ink focus:border-ink focus:outline-none appearance-none"
        >
          <option value="" disabled>
            Select a category…
          </option>
          {CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div>
        <label
          htmlFor="tip-summary"
          className="block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-500 mb-1.5"
        >
          Details <span className="text-ink-300">(required)</span>
        </label>
        <textarea
          id="tip-summary"
          required
          rows={7}
          value={form.summary}
          onChange={(e) => set("summary", e.target.value)}
          placeholder="What is the story? What do you know, and how do you know it? Include any relevant context."
          className="w-full resize-y border border-ink-200/70 bg-transparent px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-300 focus:border-ink focus:outline-none"
        />
      </div>

      {/* Source type */}
      <div>
        <label
          htmlFor="tip-source"
          className="block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-500 mb-1.5"
        >
          Source type <span className="text-ink-300">(optional)</span>
        </label>
        <input
          id="tip-source"
          type="text"
          value={form.sourceType}
          onChange={(e) => set("sourceType", e.target.value)}
          placeholder="e.g. Insider, public records, documents"
          className="w-full border border-ink-200/70 bg-transparent px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-300 focus:border-ink focus:outline-none"
        />
      </div>

      {/* Evidence links */}
      <div>
        <label
          htmlFor="tip-links"
          className="block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-500 mb-1.5"
        >
          Evidence links <span className="text-ink-300">(optional, one per line)</span>
        </label>
        <textarea
          id="tip-links"
          rows={3}
          value={form.evidenceLinks}
          onChange={(e) => set("evidenceLinks", e.target.value)}
          placeholder="https://example.com/document"
          className="w-full resize-y border border-ink-200/70 bg-transparent px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-300 focus:border-ink focus:outline-none font-mono"
        />
      </div>

      {/* Anonymous toggle */}
      <div className="border-t border-ink-200/70 pt-5">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={form.anonymous}
            onChange={(e) => set("anonymous", e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 border border-ink-300 accent-ink cursor-pointer"
          />
          <div>
            <span className="block text-[14px] text-ink font-medium">
              Submit anonymously
            </span>
            <span className="block text-[12px] text-ink-400 mt-0.5">
              We will not store your email or any identifying metadata with this tip.
            </span>
          </div>
        </label>
      </div>

      {/* Contact email — hidden when anonymous */}
      {!form.anonymous && (
        <div>
          <label
            htmlFor="tip-email"
            className="block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-500 mb-1.5"
          >
            Contact email <span className="text-ink-300">(optional)</span>
          </label>
          <input
            id="tip-email"
            type="email"
            value={form.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
            placeholder="In case we need more information"
            className="w-full border border-ink-200/70 bg-transparent px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-300 focus:border-ink focus:outline-none"
          />
        </div>
      )}

      {state === "error" && (
        <p className="text-[13px] text-rose-600">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={state === "submitting" || !form.category}
        className="inline-flex items-center bg-ink text-paper px-6 py-3 text-[13px] font-medium tracking-wide hover:bg-ink-700 transition-colors disabled:opacity-50"
      >
        {state === "submitting" ? "Sending…" : "Send tip →"}
      </button>

      <p className="text-[11px] text-ink-400 leading-relaxed max-w-[52ch]">
        All submissions are reviewed by our editorial team. We do not share
        source information. For particularly sensitive material, contact us first
        to arrange a secure channel.
      </p>
    </form>
  );
}
