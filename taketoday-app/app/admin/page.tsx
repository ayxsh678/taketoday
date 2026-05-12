"use client";

import { useState } from "react";
import type { ArticleDraft } from "@/lib/pipeline/draftArticle";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["", "AI", "Finance", "Tech", "Startups", "Briefings", "India", "International"];
const FORMATS = ["", "QuickNews", "SmartBreakdown", "DeepDive", "SocialPost"];
const REGIONS = ["", "IN", "US", "GLOBAL"];

// ─── Slug parser (manual mode) ────────────────────────────────────────────────

function parseSlugFromMdx(raw: string): string | null {
  const match = raw.match(/^slug:\s*(\S+)/m);
  return match ? match[1] : null;
}

// ─── Draft Tab ────────────────────────────────────────────────────────────────

function DraftTab() {
  const [inputMode, setInputMode] = useState<"topic" | "url" | "manual">("topic");
  const [topic, setTopic] = useState("");
  const [url, setUrl] = useState("");
  const [manualMdx, setManualMdx] = useState("");
  const [category, setCategory] = useState("");
  const [format, setFormat] = useState("");
  const [region, setRegion] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<ArticleDraft | null>(null);
  const [mdx, setMdx] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ path: string } | { error: string } | null>(null);

  async function handleDraft() {
    setError(null);
    setDraft(null);
    setMdx(null);
    setSaveResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: inputMode === "topic" ? topic : undefined,
          url: inputMode === "url" ? url : undefined,
          category: category || undefined,
          format: format || undefined,
          region: region || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unknown error");
        return;
      }

      setDraft(data.draft);
      setMdx(data.mdx);
      setPublishedAt(data.publishedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(overrideSlug?: string, overrideMdx?: string) {
    const saveSlug = overrideSlug ?? draft?.slug;
    const saveMdx = overrideMdx ?? mdx;
    if (!saveSlug || !saveMdx) return;

    setSaving(true);
    setSaveResult(null);

    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: saveSlug, mdx: saveMdx }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveResult({ error: data.error ?? "Unknown error" });
        return;
      }
      setSaveResult({ path: data.path });
    } catch (err) {
      setSaveResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  }

  const parsedManualSlug = inputMode === "manual" ? parseSlugFromMdx(manualMdx) : null;
  const canSubmit =
    inputMode === "topic"
      ? topic.trim() !== ""
      : inputMode === "url"
        ? url.trim() !== ""
        : manualMdx.trim() !== "" && parsedManualSlug !== null;

  const MODE_LABELS: Record<"topic" | "url" | "manual", string> = {
    topic: "Topic",
    url: "URL",
    manual: "Manual",
  };

  return (
    <div className="space-y-6">
      {/* Input mode toggle */}
      <div className="flex gap-1 border border-ink-200 rounded p-1 w-fit">
        {(["topic", "url", "manual"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              setInputMode(mode);
              setError(null);
              setDraft(null);
              setMdx(null);
              setSaveResult(null);
            }}
            className={`px-4 py-1.5 text-sm rounded transition-colors ${
              inputMode === mode
                ? "bg-ink text-paper"
                : "text-ink-500 hover:text-ink"
            }`}
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      {/* Main input */}
      {inputMode === "topic" && (
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Fed raises rates again, markets react"
          rows={3}
          className="w-full border border-ink-200 rounded px-3 py-2 text-sm font-sans bg-paper text-ink placeholder-ink-400 focus:outline-none focus:border-ink resize-none"
        />
      )}

      {inputMode === "url" && (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          className="w-full border border-ink-200 rounded px-3 py-2 text-sm font-sans bg-paper text-ink placeholder-ink-400 focus:outline-none focus:border-ink"
        />
      )}

      {inputMode === "manual" && (
        <div className="space-y-2">
          <p className="text-xs text-ink-500">
            Paste complete MDX with frontmatter. Slug is read from the{" "}
            <code className="font-mono bg-ink-100 px-1 rounded">slug:</code> field.
          </p>
          <textarea
            value={manualMdx}
            onChange={(e) => {
              setManualMdx(e.target.value);
              setSaveResult(null);
            }}
            placeholder={"---\nslug: my-article-slug\ntitle: \"Article Title\"\n...\n---\n\nBody here."}
            rows={18}
            className="w-full border border-ink-200 rounded px-3 py-2 text-xs font-mono bg-paper text-ink placeholder-ink-400 focus:outline-none focus:border-ink resize-y"
          />
          {manualMdx.trim() && (
            <p className="text-xs text-ink-500">
              Slug:{" "}
              {parsedManualSlug ? (
                <code className="font-mono bg-ink-100 px-1 rounded text-ink">{parsedManualSlug}</code>
              ) : (
                <span className="text-accent">not found — add <code className="font-mono">slug: your-slug</code> to frontmatter</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Optional hints — AI modes only */}
      {inputMode !== "manual" && (
        <div className="flex flex-wrap gap-3">
          <SelectField label="Category" value={category} onChange={setCategory} options={CATEGORIES} />
          <SelectField label="Format" value={format} onChange={setFormat} options={FORMATS} />
          <SelectField label="Region" value={region} onChange={setRegion} options={REGIONS} />
        </div>
      )}

      {/* Action button */}
      {inputMode === "manual" ? (
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleSave(parsedManualSlug ?? undefined, manualMdx)}
            disabled={saving || !canSubmit || (saveResult !== null && "path" in saveResult)}
            className="px-5 py-2 bg-ink text-paper text-sm rounded hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving…" : "Save to Disk"}
          </button>
          {saveResult && "path" in saveResult && (
            <p className="text-sm text-ink-700">
              Saved →{" "}
              <code className="font-mono text-xs bg-ink-100 px-1.5 py-0.5 rounded">{saveResult.path}</code>
            </p>
          )}
          {saveResult && "error" in saveResult && (
            <p className="text-accent text-sm">{saveResult.error}</p>
          )}
        </div>
      ) : (
        <button
          onClick={handleDraft}
          disabled={loading || !canSubmit}
          className="px-5 py-2 bg-ink text-paper text-sm rounded hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Drafting…" : "Draft Article"}
        </button>
      )}

      {error && (
        <p className="text-accent text-sm border border-accent/30 bg-accent/5 rounded px-3 py-2">
          {error}
        </p>
      )}

      {/* AI draft output */}
      {draft && mdx && (
        <div className="space-y-5 pt-2 border-t border-ink-200">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-ink-500">Title</p>
            <p className="font-serif text-xl">{draft.title}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-ink-500">Deck</p>
            <p className="text-sm text-ink-700">{draft.deck}</p>
          </div>
          <div className="flex gap-4 text-xs text-ink-500">
            <span>
              <span className="text-ink font-medium">{draft.category}</span> · {draft.format} · {draft.region}
            </span>
            <span>{publishedAt}</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-ink-500">Quick Take</p>
            <p className="text-sm italic text-ink-700">{draft.quickTake}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-ink-500">Why It Matters</p>
            <p className="text-sm text-ink-700">{draft.whyItMatters}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-ink-500">Takeaways</p>
            <ul className="list-disc list-inside space-y-1">
              {draft.takeaways.map((t, i) => (
                <li key={i} className="text-sm text-ink-700">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-ink-500">MDX</p>
            <pre className="font-mono text-xs bg-ink-100 text-ink rounded p-4 overflow-x-auto whitespace-pre-wrap">
              {mdx}
            </pre>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleSave()}
              disabled={saving || (saveResult !== null && "path" in saveResult)}
              className="px-5 py-2 bg-ink text-paper text-sm rounded hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Save to Disk"}
            </button>
            {saveResult && "path" in saveResult && (
              <p className="text-sm text-ink-700">
                Saved →{" "}
                <code className="font-mono text-xs bg-ink-100 px-1.5 py-0.5 rounded">{saveResult.path}</code>
              </p>
            )}
            {saveResult && "error" in saveResult && (
              <p className="text-accent text-sm">{saveResult.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Enrich Tab ───────────────────────────────────────────────────────────────

function EnrichTab() {
  const [slug, setSlug] = useState("");
  const [force, setForce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    generated: string[];
    quickTake: string;
    whyItMatters: string;
    takeaways: [string, string, string];
  } | null>(null);

  async function handleEnrich() {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug.trim(), force }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unknown error");
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs uppercase tracking-wider text-ink-500">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. fed-raises-rates-again"
            className="w-full border border-ink-200 rounded px-3 py-2 text-sm font-sans bg-paper text-ink placeholder-ink-400 focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={force}
          onChange={(e) => setForce(e.target.checked)}
          className="w-4 h-4 accent-ink"
        />
        <span className="text-sm text-ink-700">Force regenerate (overwrite existing fields)</span>
      </label>

      <button
        onClick={handleEnrich}
        disabled={loading || slug.trim() === ""}
        className="px-5 py-2 bg-ink text-paper text-sm rounded hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Enriching…" : "Enrich Article"}
      </button>

      {error && (
        <p className="text-accent text-sm border border-accent/30 bg-accent/5 rounded px-3 py-2">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-5 pt-2 border-t border-ink-200">
          {result.generated.length === 0 ? (
            <p className="text-sm text-ink-500">All fields already present. Use force to regenerate.</p>
          ) : (
            <p className="text-sm text-ink-500">
              Generated: <span className="text-ink font-medium">{result.generated.join(", ")}</span>
            </p>
          )}
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-ink-500">Quick Take</p>
            <p className="text-sm italic text-ink-700">{result.quickTake}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-ink-500">Why It Matters</p>
            <p className="text-sm text-ink-700">{result.whyItMatters}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-ink-500">Takeaways</p>
            <ul className="list-disc list-inside space-y-1">
              {result.takeaways.map((t, i) => (
                <li key={i} className="text-sm text-ink-700">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared select ────────────────────────────────────────────────────────────

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-wider text-ink-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-ink-200 rounded px-3 py-2 text-sm bg-paper text-ink focus:outline-none focus:border-ink"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt || `Any ${label}`}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "draft" | "enrich";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("draft");

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl tracking-tight">Admin</h1>
        <p className="text-sm text-ink-500 mt-1">Local-only. AI drafting and article enrichment.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-200 mb-8">
        {(["draft", "enrich"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize -mb-px border-b-2 transition-colors ${
              tab === t
                ? "border-ink text-ink font-medium"
                : "border-transparent text-ink-500 hover:text-ink"
            }`}
          >
            {t === "draft" ? "Draft Article" : "Enrich Article"}
          </button>
        ))}
      </div>

      {tab === "draft" ? <DraftTab /> : <EnrichTab />}
    </div>
  );
}
