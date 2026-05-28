"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CONTRIBUTION_TYPES = [
  { value: "BREAKING_NEWS", label: "Breaking News", icon: "⚡" },
  { value: "INVESTIGATION", label: "Investigation", icon: "🔍" },
  { value: "RESEARCH", label: "Research", icon: "📊" },
  { value: "EXPLAINER", label: "Explainer", icon: "💡" },
  { value: "DATA_JOURNALISM", label: "Data Journalism", icon: "📈" },
  { value: "THREAD", label: "Thread", icon: "🧵" },
  { value: "DOCUMENT_LEAK", label: "Document Leak", icon: "📄" },
  { value: "PHOTO_REPORT", label: "Photo Report", icon: "📷" },
  { value: "VIDEO_REPORT", label: "Video Report", icon: "🎥" },
  { value: "OPINION", label: "Opinion", icon: "✍️" },
  { value: "COMMUNITY_NOTE", label: "Community Note", icon: "📌" },
  { value: "WHISTLEBLOWER_TIP", label: "Tip / Whistleblower", icon: "🔒" },
] as const;

function NewContributionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = searchParams.get("type") ?? "BREAKING_NEWS";

  const [form, setForm] = useState({
    type: defaultType,
    title: "",
    summary: "",
    body: "",
    location: "",
    language: "en",
    isBreaking: false,
    aiUsageDisclosed: false,
    tags: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(submit = false) {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          summary: form.summary || undefined,
          body: form.body,
          location: form.location || undefined,
          language: form.language,
          isBreaking: form.isBreaking,
          aiUsageDisclosed: form.aiUsageDisclosed,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      const data = (await res.json()) as { contribution?: { id: string }; error?: string };

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/contribute/login?next=/contribute/new");
          return;
        }
        setError(data.error ?? "Failed to save");
        return;
      }

      const id = data.contribution?.id;
      if (!id) return;

      setSaved(true);

      if (submit) {
        const submitRes = await fetch(`/api/contribute/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "submit" }),
        });
        if (submitRes.ok) {
          router.push(`/contribute/${id}?submitted=1`);
          return;
        }
      }

      router.push(`/contribute/${id}/edit`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-instrument text-3xl text-ink mb-1">New contribution</h1>
          <p className="text-ink/60 text-sm">
            Your story will be reviewed by editors and the community before publishing.
          </p>
        </div>

        <div className="space-y-6">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-2">Type</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CONTRIBUTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${
                    form.type === t.value
                      ? "border-ink bg-ink/5 text-ink"
                      : "border-ink/10 text-ink/60 hover:border-ink/20"
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Headline *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Specific, factual headline"
              className="w-full border border-ink/20 rounded-lg px-4 py-3 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/50 font-instrument text-xl"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Summary</label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              placeholder="1–2 sentence summary of the key fact and why it matters"
              rows={2}
              maxLength={500}
              className="w-full border border-ink/20 rounded-lg px-4 py-3 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/50 text-sm resize-none"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Content *</label>
            <textarea
              required
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Write your full story here. You can use Markdown formatting."
              rows={16}
              className="w-full border border-ink/20 rounded-lg px-4 py-3 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/50 text-sm font-mono resize-y"
            />
            <p className="text-xs text-ink/40 mt-1">Markdown supported. {form.body.length}/100000 chars.</p>
          </div>

          {/* Metadata row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. New Delhi, India"
                className="w-full border border-ink/20 rounded-lg px-4 py-2.5 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="politics, corruption, climate"
                className="w-full border border-ink/20 rounded-lg px-4 py-2.5 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/50 text-sm"
              />
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-ink/70 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isBreaking}
                onChange={(e) => setForm((f) => ({ ...f, isBreaking: e.target.checked }))}
                className="rounded border-ink/30"
              />
              Breaking news
            </label>
            <label className="flex items-center gap-2 text-sm text-ink/70 cursor-pointer">
              <input
                type="checkbox"
                checked={form.aiUsageDisclosed}
                onChange={(e) => setForm((f) => ({ ...f, aiUsageDisclosed: e.target.checked }))}
                className="rounded border-ink/30"
              />
              AI assistance used in drafting
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
              Draft saved. AI analysis running in background.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={loading || !form.title || !form.body}
              className="border border-ink/20 text-ink px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-ink/5 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={loading || !form.title || !form.body}
              className="bg-ink text-paper px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting…" : "Submit for review →"}
            </button>
          </div>

          <p className="text-xs text-ink/40">
            By submitting, you confirm this is your original work or properly attributed,
            and you agree to TakeToday&apos;s contributor guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NewContributionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <NewContributionForm />
    </Suspense>
  );
}
