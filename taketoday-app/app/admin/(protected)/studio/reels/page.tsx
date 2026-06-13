"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw, Save } from "lucide-react";

type ReelSection = { on_screen: string; voiceover: string };
type ReelScript = {
  draftId: string;
  hook: ReelSection;
  body: ReelSection[];
  cta: ReelSection;
  estimated_duration: number;
};

const HOOK_STYLES = ["Question", "Stat", "Controversy", "Story"] as const;
const DURATIONS = [15, 30, 60] as const;

function SectionCard({
  label,
  section,
  onChange,
}: {
  label: string;
  section: ReelSection;
  onChange: (field: keyof ReelSection, value: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(section.voiceover);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
        <button onClick={copy} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy voiceover"}
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">On-screen text</label>
          <input
            value={section.on_screen}
            onChange={(e) => onChange("on_screen", e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm font-semibold"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Voiceover</label>
          <textarea
            value={section.voiceover}
            onChange={(e) => onChange("voiceover", e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
          />
        </div>
      </div>
    </div>
  );
}

export default function ReelsPage() {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(30);
  const [hookStyle, setHookStyle] = useState<(typeof HOOK_STYLES)[number]>("Question");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [script, setScript] = useState<ReelScript | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/studio/reel/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, duration, hookStyle }),
      });
      const json = (await resp.json()) as { ok: boolean; data: ReelScript; error?: string };
      if (!json.ok) throw new Error(json.error ?? "Generation failed");
      setScript(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const updateHook = (field: keyof ReelSection, value: string) =>
    setScript((prev) => prev ? { ...prev, hook: { ...prev.hook, [field]: value } } : prev);

  const updateBodyBeat = (i: number, field: keyof ReelSection, value: string) =>
    setScript((prev) => {
      if (!prev) return prev;
      const body = [...prev.body];
      body[i] = { ...body[i], [field]: value };
      return { ...prev, body };
    });

  const updateCta = (field: keyof ReelSection, value: string) =>
    setScript((prev) => prev ? { ...prev, cta: { ...prev.cta, [field]: value } } : prev);

  const copyAll = async () => {
    if (!script) return;
    const text = [
      `[HOOK]\n${script.hook.voiceover}`,
      ...script.body.map((b, i) => `[BODY ${i + 1}]\n${b.voiceover}`),
      `[CTA]\n${script.cta.voiceover}`,
    ].join("\n\n");
    await navigator.clipboard.writeText(text);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSave = async () => {
    if (!script) return;
    setSaving(true);
    try {
      await fetch("/api/studio/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: script.draftId,
          platforms: ["INSTAGRAM"],
          content: `${script.hook.voiceover}\n\n${script.body.map((b) => b.voiceover).join("\n")}\n\n${script.cta.voiceover}`,
          mediaUrls: [],
          scheduledAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Reel Script Generator</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate structured short-form video scripts.</p>
      </div>

      {/* Form */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. How AI is changing journalism in 2025"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Duration</label>
            <div className="mt-1 flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-1.5 rounded-md text-sm border ${duration === d ? "bg-primary text-primary-foreground border-primary" : ""}`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Hook Style</label>
            <select
              value={hookStyle}
              onChange={(e) => setHookStyle(e.target.value as (typeof HOOK_STYLES)[number])}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {HOOK_STYLES.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate Script"}
        </button>
      </div>

      {/* Script output */}
      {script && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Script</h2>
              <span className="text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">
                ~{script.estimated_duration}s
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm"
              >
                {saved ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                Copy All
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm"
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                Regenerate
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm"
              >
                <Save className="size-4" />
                {saving ? "Saving…" : "Save Script"}
              </button>
            </div>
          </div>

          <SectionCard label="Hook" section={script.hook} onChange={updateHook} />

          {script.body.map((beat, i) => (
            <SectionCard
              key={i}
              label={`Body — Beat ${i + 1}`}
              section={beat}
              onChange={(field, value) => updateBodyBeat(i, field, value)}
            />
          ))}

          <SectionCard label="CTA" section={script.cta} onChange={updateCta} />
        </div>
      )}
    </div>
  );
}
