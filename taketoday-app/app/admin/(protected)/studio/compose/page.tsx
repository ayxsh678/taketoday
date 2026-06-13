"use client";

import { useState } from "react";

const PLATFORMS = [
  { key: "INSTAGRAM", label: "Instagram", limit: 2200, color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { key: "TWITTER", label: "Twitter/X", limit: 280, color: "bg-black" },
  { key: "LINKEDIN", label: "LinkedIn", limit: 3000, color: "bg-blue-600" },
  { key: "WHATSAPP", label: "WhatsApp", limit: 4096, color: "bg-green-500" },
] as const;

type PlatformKey = (typeof PLATFORMS)[number]["key"];

type PostResult = Record<string, { success: boolean; post_id?: string; error?: string }>;

export default function ComposePage() {
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<Set<PlatformKey>>(new Set(["INSTAGRAM"]));
  const [mediaUrls, setMediaUrls] = useState<string[]>([""]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PostResult | null>(null);
  const [error, setError] = useState("");

  const togglePlatform = (key: PlatformKey) =>
    setPlatforms((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const updateMediaUrl = (i: number, val: string) => {
    setMediaUrls((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  };

  const addMediaUrl = () => setMediaUrls((prev) => [...prev, ""]);
  const removeMediaUrl = (i: number) => setMediaUrls((prev) => prev.filter((_, j) => j !== i));

  const handleSubmit = async (postNow: boolean) => {
    if (!content.trim() || platforms.size === 0) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const validUrls = mediaUrls.filter((u) => u.trim().startsWith("http"));
      const body = {
        platforms: [...platforms],
        content,
        mediaUrls: validUrls,
        ...(scheduledAt && !postNow ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
      };
      const resp = await fetch("/api/studio/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await resp.json()) as { ok: boolean; data: PostResult | { scheduled: string[] }; error?: string };
      if (!json.ok) throw new Error(json.error ?? "Failed");
      if ("scheduled" in json.data) {
        setResult({ scheduled: { success: true, post_id: `${(json.data as { scheduled: string[] }).scheduled.length} posts queued` } });
      } else {
        setResult(json.data as PostResult);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const activePlatform = PLATFORMS.find((p) => platforms.has(p.key));
  const charLimit = activePlatform?.limit ?? 2200;
  const overLimit = content.length > charLimit;

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Post Composer</h1>
        <p className="text-muted-foreground text-sm mt-1">Write and publish to multiple platforms at once.</p>
      </div>

      {/* Platform toggles */}
      <div className="flex gap-2 flex-wrap">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            onClick={() => togglePlatform(p.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              platforms.has(p.key) ? `${p.color} text-white border-transparent` : "bg-card text-muted-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Character counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PLATFORMS.map((p) => {
          const pct = Math.min((content.length / p.limit) * 100, 100);
          const over = content.length > p.limit;
          return (
            <div key={p.key} className="rounded-lg border bg-card p-3 text-center">
              <p className="text-xs font-medium text-muted-foreground">{p.label}</p>
              <p className={`text-lg font-bold mt-1 ${over ? "text-destructive" : ""}`}>
                {p.limit - content.length}
              </p>
              <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${over ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Text area */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post here…"
          rows={8}
          className="w-full bg-background rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {overLimit && (
          <p className="text-xs text-destructive">
            Over limit for Twitter/X by {content.length - 280} characters.
          </p>
        )}
      </div>

      {/* Media URLs */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Media URLs (optional)</label>
        {mediaUrls.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={url}
              onChange={(e) => updateMediaUrl(i, e.target.value)}
              placeholder="https://..."
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            />
            {mediaUrls.length > 1 && (
              <button onClick={() => removeMediaUrl(i)} className="px-3 py-2 rounded-md border text-sm text-destructive">
                ×
              </button>
            )}
          </div>
        ))}
        <button onClick={addMediaUrl} className="text-xs text-muted-foreground hover:text-foreground underline">
          + Add media URL
        </button>
      </div>

      {/* Schedule picker */}
      <div>
        <label className="text-sm font-medium">Schedule (optional)</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="mt-1 block w-full sm:w-72 rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <p className="text-sm font-semibold">Result</p>
          {Object.entries(result).map(([platform, res]) => (
            <div key={platform} className="flex items-center gap-2 text-sm">
              <span className={`size-2 rounded-full ${res.success ? "bg-green-500" : "bg-destructive"}`} />
              <span className="font-medium">{platform}</span>
              <span className="text-muted-foreground">{res.success ? res.post_id ?? "Posted" : res.error}</span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => handleSubmit(true)}
          disabled={loading || !content.trim() || platforms.size === 0}
          className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Posting…" : "Post Now"}
        </button>
        {scheduledAt && (
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading || !content.trim() || platforms.size === 0}
            className="px-6 py-2 rounded-md border text-sm font-medium disabled:opacity-50"
          >
            Schedule
          </button>
        )}
      </div>
    </div>
  );
}
