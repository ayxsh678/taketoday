"use client";

import { useState } from "react";
import { MissionDifficulty, MissionStatus } from "@prisma/client";
import { POINTS_BY_DIFFICULTY } from "@/lib/missions";

type Props = {
  missionId: string;
  difficulty: MissionDifficulty;
  status: MissionStatus;
};

type FormState = "idle" | "submitting" | "success" | "error";

export function MissionSubmissionForm({ missionId, difficulty, status }: Props) {
  const [form, setForm] = useState({ email: "", name: "", text: "" });
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isAccepting =
    status === MissionStatus.OPEN || status === MissionStatus.IN_PROGRESS;

  if (!isAccepting) {
    return (
      <div className="border border-ink-200/70 p-6">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-2">
          Submissions closed
        </p>
        <p className="text-[14px] text-ink-500">
          This mission is no longer accepting submissions.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/missions/${missionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitterEmail: form.email,
          submitterName: form.name || undefined,
          submissionText: form.text,
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
          Submission received
        </p>
        <h3 className="font-serif text-[22px] text-ink mb-2">
          Thank you for contributing.
        </h3>
        <p className="text-[14px] text-ink-500 max-w-[50ch]">
          Our editors will review your submission and award{" "}
          <strong>{POINTS_BY_DIFFICULTY[difficulty]} points</strong> if approved.
          You&rsquo;ll be notified at the email you provided.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-ink-200/70 p-6 space-y-5">
      <div>
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-4">
          Submit findings · +{POINTS_BY_DIFFICULTY[difficulty]} pts on approval
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="sub-email"
            className="block font-mono text-[10px] tracking-[0.15em] uppercase text-ink-500 mb-1.5"
          >
            Email <span className="text-ink-300">(required)</span>
          </label>
          <input
            id="sub-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com"
            className="w-full border border-ink-200/70 bg-transparent px-3 py-2 text-[14px] text-ink placeholder:text-ink-300 focus:border-ink focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="sub-name"
            className="block font-mono text-[10px] tracking-[0.15em] uppercase text-ink-500 mb-1.5"
          >
            Name <span className="text-ink-300">(optional)</span>
          </label>
          <input
            id="sub-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="For public credit"
            className="w-full border border-ink-200/70 bg-transparent px-3 py-2 text-[14px] text-ink placeholder:text-ink-300 focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="sub-text"
          className="block font-mono text-[10px] tracking-[0.15em] uppercase text-ink-500 mb-1.5"
        >
          Your findings <span className="text-ink-300">(min 20 characters)</span>
        </label>
        <textarea
          id="sub-text"
          required
          rows={8}
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          placeholder="Describe what you found, how you found it, and any relevant sources or evidence."
          className="w-full resize-y border border-ink-200/70 bg-transparent px-3 py-2 text-[14px] text-ink placeholder:text-ink-300 focus:border-ink focus:outline-none"
        />
      </div>

      {state === "error" && (
        <p className="text-[13px] text-rose-600">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="inline-flex items-center bg-ink text-paper px-6 py-2.5 text-[13px] font-medium tracking-wide hover:bg-ink-700 transition-colors disabled:opacity-50"
      >
        {state === "submitting" ? "Submitting…" : "Submit findings →"}
      </button>
    </form>
  );
}
