"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MissionDifficulty } from "@prisma/client";
import { POINTS_BY_DIFFICULTY } from "@/lib/missions";

const DIFFICULTIES: { value: MissionDifficulty; label: string }[] = [
  { value: "EASY", label: "Easy — 50 pts" },
  { value: "MEDIUM", label: "Medium — 150 pts" },
  { value: "HARD", label: "Hard — 300 pts" },
];

const CATEGORIES = ["AI", "Finance", "Technology", "Startups", "Investigative", "Policy", "Other"];

export default function CreateMissionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "MEDIUM" as MissionDifficulty,
    deadline: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          difficulty: form.difficulty,
          deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to create mission.");
        setSaving(false);
        return;
      }

      router.push(`/admin/missions/${json.data.mission.id}`);
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--adm-text-1)" }}>
          Create mission
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--adm-text-2)" }}>
          Publish a research task for readers to complete.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg p-6" style={{ background: "var(--adm-surface-1)", border: "1px solid var(--adm-border)" }}>
        {/* Title */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--adm-text-2)" }}>
            Title <span style={{ color: "var(--adm-accent-red)" }}>*</span>
          </label>
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="What should readers investigate?"
            className="w-full rounded-md px-3 py-2 text-sm outline-none transition-colors"
            style={{
              background: "var(--adm-surface-2)",
              border: "1px solid var(--adm-border)",
              color: "var(--adm-text-1)",
            }}
          />
        </div>

        {/* Category + Difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--adm-text-2)" }}>
              Category <span style={{ color: "var(--adm-accent-red)" }}>*</span>
            </label>
            <select
              required
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm outline-none appearance-none"
              style={{
                background: "var(--adm-surface-2)",
                border: "1px solid var(--adm-border)",
                color: form.category ? "var(--adm-text-1)" : "var(--adm-text-3)",
              }}
            >
              <option value="" disabled>Select category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--adm-text-2)" }}>
              Difficulty
            </label>
            <select
              value={form.difficulty}
              onChange={(e) => set("difficulty", e.target.value as MissionDifficulty)}
              className="w-full rounded-md px-3 py-2 text-sm outline-none appearance-none"
              style={{
                background: "var(--adm-surface-2)",
                border: "1px solid var(--adm-border)",
                color: "var(--adm-text-1)",
              }}
            >
              {DIFFICULTIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Points preview */}
        <p className="text-xs" style={{ color: "var(--adm-text-3)" }}>
          Reward on approval:{" "}
          <span style={{ color: "var(--adm-accent-amber)" }} className="font-semibold">
            +{POINTS_BY_DIFFICULTY[form.difficulty]} points
          </span>
        </p>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--adm-text-2)" }}>
            Description <span style={{ color: "var(--adm-accent-red)" }}>*</span>
          </label>
          <textarea
            required
            rows={8}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe what readers should investigate, what evidence to look for, and how to document their findings."
            className="w-full resize-y rounded-md px-3 py-2 text-sm outline-none transition-colors"
            style={{
              background: "var(--adm-surface-2)",
              border: "1px solid var(--adm-border)",
              color: "var(--adm-text-1)",
            }}
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--adm-text-2)" }}>
            Deadline <span style={{ color: "var(--adm-text-3)" }}>(optional)</span>
          </label>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => set("deadline", e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="rounded-md px-3 py-2 text-sm outline-none"
            style={{
              background: "var(--adm-surface-2)",
              border: "1px solid var(--adm-border)",
              color: "var(--adm-text-1)",
            }}
          />
        </div>

        {error && (
          <p className="text-sm rounded-md px-3 py-2" style={{ background: "rgba(248,113,113,0.08)", color: "var(--adm-accent-red)", border: "1px solid rgba(248,113,113,0.2)" }}>
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: "var(--adm-accent-blue)" }}
          >
            {saving ? "Publishing…" : "Publish mission"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{ color: "var(--adm-text-2)", border: "1px solid var(--adm-border)" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
