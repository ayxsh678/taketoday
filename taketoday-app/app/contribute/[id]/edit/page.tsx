"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { RichEditor } from "@/components/contribute/RichEditor";
import Link from "next/link";

interface Contribution {
  id: string;
  title: string;
  summary?: string | null;
  body: string;
  type: string;
  tags: string[];
  location?: string | null;
  isBreaking: boolean;
  aiUsageDisclosed: boolean;
  workflowStage: string;
  versions: Array<{ id: string; versionNumber: number; commitMessage?: string | null; createdAt: string }>;
  aiAnalysis?: {
    biasScore?: number | null;
    misinformationRisk?: number | null;
    suggestedHeadlines?: string[];
    suggestedKeywords?: string[];
    sentimentLabel?: string | null;
    factClaimsExtracted?: unknown;
  } | null;
}

export default function EditContributionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [contribution, setContribution] = useState<Contribution | null>(null);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    body: "",
    tags: "",
    location: "",
    isBreaking: false,
    aiUsageDisclosed: false,
    commitMessage: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    fetch(`/api/contribute/${id}`)
      .then((r) => r.json())
      .then((d: { data?: { contribution: Contribution } }) => {
        const c = d.data?.contribution;
        if (!c) return;
        setContribution(c);
        setForm({
          title: c.title,
          summary: c.summary ?? "",
          body: c.body,
          tags: c.tags.join(", "),
          location: c.location ?? "",
          isBreaking: c.isBreaking,
          aiUsageDisclosed: c.aiUsageDisclosed,
          commitMessage: "",
        });
      })
      .catch(() => {});
  }, [id]);

  const handleBodyChange = useCallback((_html: string, text: string) => {
    setForm((f) => ({ ...f, body: text }));
  }, []);

  async function handleSave(submit = false) {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/contribute/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          summary: form.summary || undefined,
          body: form.body,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          location: form.location || undefined,
          isBreaking: form.isBreaking,
          aiUsageDisclosed: form.aiUsageDisclosed,
          commitMessage: form.commitMessage || undefined,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) { setError(data.error ?? "Save failed"); return; }

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

      // Refresh contribution to get new version list
      const refreshed = await fetch(`/api/contribute/${id}`).then((r) => r.json() as Promise<{ data?: { contribution: Contribution } }>);
      if (refreshed.data?.contribution) {
        setContribution(refreshed.data.contribution);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (!contribution) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-ink/40 text-sm">Loading…</div>
      </div>
    );
  }

  const ai = contribution.aiAnalysis;
  const canSubmit = ["DRAFT", "SUBMITTED"].includes(contribution.workflowStage);

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={`/contribute/${id}`} className="text-ink/50 hover:text-ink text-sm">← View</Link>
            <span className="text-ink/20">/</span>
            <span className="text-sm font-mono text-ink/60">{contribution.type.replace(/_/g, " ")}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              contribution.workflowStage === "DRAFT" ? "bg-gray-100 text-gray-600" :
              contribution.workflowStage === "SUBMITTED" ? "bg-blue-50 text-blue-700" :
              "bg-green-50 text-green-700"
            }`}>
              {contribution.workflowStage.replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowVersions(!showVersions)}
              className="text-xs border border-ink/15 text-ink/60 px-3 py-1.5 rounded-lg hover:bg-ink/5"
            >
              {contribution.versions.length} versions
            </button>
            {ai && (
              <button
                type="button"
                onClick={() => setShowAI(!showAI)}
                className="text-xs border border-blue-200 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100"
              >
                🤖 AI insights
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main editor */}
          <div className="lg:col-span-3 space-y-4">
            <div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Headline"
                className="w-full border border-ink/20 rounded-xl px-4 py-3 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/40 font-instrument text-2xl"
              />
            </div>

            <div>
              <textarea
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                placeholder="Summary (1–2 sentences)"
                rows={2}
                maxLength={500}
                className="w-full border border-ink/20 rounded-xl px-4 py-2.5 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/40 text-sm resize-none"
              />
            </div>

            <RichEditor
              content={form.body}
              onChange={handleBodyChange}
              placeholder="Write your full story…"
              autofocus
              maxChars={100_000}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}
            {saved && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
                Saved as new version.
              </div>
            )}

            {/* Commit message */}
            <input
              type="text"
              value={form.commitMessage}
              onChange={(e) => setForm((f) => ({ ...f, commitMessage: e.target.value }))}
              placeholder="Describe what changed (optional)"
              maxLength={200}
              className="w-full border border-ink/15 rounded-lg px-3 py-2 text-sm text-ink/80 bg-paper placeholder:text-ink/30 focus:outline-none focus:border-ink/35 font-mono"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving || !form.title || !form.body}
                className="border border-ink/20 text-ink px-5 py-2 rounded-lg text-sm font-medium hover:bg-ink/5 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save version"}
              </button>
              {canSubmit && (
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={saving || !form.title || !form.body}
                  className="bg-ink text-paper px-5 py-2 rounded-lg text-sm font-medium hover:bg-ink/90 disabled:opacity-50"
                >
                  {saving ? "…" : "Submit for review →"}
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Metadata */}
            <div className="border border-ink/10 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-ink/60 uppercase tracking-wide">Metadata</h3>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Mumbai, India"
                  className="w-full border border-ink/15 rounded-lg px-3 py-1.5 text-xs text-ink bg-paper placeholder:text-ink/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="politics, climate"
                  className="w-full border border-ink/15 rounded-lg px-3 py-1.5 text-xs text-ink bg-paper placeholder:text-ink/30 focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-ink/70 cursor-pointer">
                <input type="checkbox" checked={form.isBreaking} onChange={(e) => setForm((f) => ({ ...f, isBreaking: e.target.checked }))} />
                Breaking news
              </label>
              <label className="flex items-center gap-2 text-xs text-ink/70 cursor-pointer">
                <input type="checkbox" checked={form.aiUsageDisclosed} onChange={(e) => setForm((f) => ({ ...f, aiUsageDisclosed: e.target.checked }))} />
                AI used in drafting
              </label>
            </div>

            {/* AI suggestions */}
            {showAI && ai && (
              <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-blue-800 uppercase tracking-wide">AI Insights</h3>
                {ai.biasScore !== null && ai.biasScore !== undefined && (
                  <div className="text-xs">
                    <span className="text-ink/50">Bias</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-ink/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ai.biasScore > 60 ? "bg-orange-500" : "bg-green-500"}`}
                          style={{ width: `${ai.biasScore}%` }}
                        />
                      </div>
                      <span className="font-mono">{ai.biasScore}/100</span>
                    </div>
                  </div>
                )}
                {ai.misinformationRisk !== null && ai.misinformationRisk !== undefined && (
                  <div className="text-xs">
                    <span className="text-ink/50">Misinfo risk</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-ink/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ai.misinformationRisk > 50 ? "bg-red-500" : "bg-green-500"}`}
                          style={{ width: `${ai.misinformationRisk}%` }}
                        />
                      </div>
                      <span className="font-mono">{ai.misinformationRisk}/100</span>
                    </div>
                  </div>
                )}
                {ai.suggestedHeadlines && ai.suggestedHeadlines.length > 0 && (
                  <div>
                    <div className="text-xs text-ink/50 mb-1">Headline suggestions</div>
                    {ai.suggestedHeadlines.map((h, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, title: h }))}
                        className="block w-full text-left text-xs text-blue-700 hover:text-blue-900 py-0.5 hover:underline"
                      >
                        → {h}
                      </button>
                    ))}
                  </div>
                )}
                {ai.suggestedKeywords && ai.suggestedKeywords.length > 0 && (
                  <div>
                    <div className="text-xs text-ink/50 mb-1">Suggested tags</div>
                    <div className="flex flex-wrap gap-1">
                      {ai.suggestedKeywords.slice(0, 8).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setForm((f) => ({
                            ...f,
                            tags: f.tags ? `${f.tags}, ${k}` : k,
                          }))}
                          className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          + {k}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Version history */}
            {showVersions && contribution.versions.length > 0 && (
              <div className="border border-ink/10 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-ink/60 uppercase tracking-wide mb-3">Version history</h3>
                <div className="space-y-2">
                  {contribution.versions.map((v) => (
                    <div key={v.id} className="text-xs">
                      <span className="font-mono text-ink/50">v{v.versionNumber}</span>
                      <span className="text-ink/70 ml-2">{v.commitMessage ?? "Updated"}</span>
                      <div className="text-ink/30 mt-0.5">{new Date(v.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
