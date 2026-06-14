"use client";

import { useCallback, useEffect, useState } from "react";
import { Link2, Plus, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Source {
  id: string;
  url: string | null;
  title: string | null;
  domain: string | null;
  note: string | null;
  createdAt: string;
}

interface Props {
  articleId: string;
}

export function SourcesPanel({ articleId }: Props) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/sources`);
      if (!res.ok) return;
      const json = await res.json();
      setSources((json.data as { sources: Source[] }).sources ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => { void fetchSources(); }, [fetchSources]);

  const addSource = useCallback(async () => {
    if (!url.trim() && !title.trim()) {
      setFormError("URL or title required");
      return;
    }
    setAdding(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || undefined,
          title: title.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
      const source = (json.data as { source: Source }).source;
      setSources((prev) => [...prev, source]);
      setUrl("");
      setTitle("");
      setNote("");
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add source");
    } finally {
      setAdding(false);
    }
  }, [articleId, url, title, note]);

  const removeSource = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/sources/${sid}`, { method: "DELETE" });
      if (!res.ok) return;
      setSources((prev) => prev.filter((s) => s.id !== sid));
    } catch {
      // silent
    }
  }, [articleId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--adm-text-3)" }}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* source list */}
      {sources.length === 0 && !showForm && (
        <p className="text-xs" style={{ color: "var(--adm-text-3)" }}>
          No sources added yet.
        </p>
      )}

      {sources.map((source) => (
        <div
          key={source.id}
          className="group flex items-start gap-2 rounded-md p-2.5"
          style={{ background: "var(--adm-surface-2)", border: "1px solid var(--adm-border-dim)" }}
        >
          <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-40" />
          <div className="min-w-0 flex-1">
            {source.title && (
              <p className="truncate text-xs font-medium" style={{ color: "var(--adm-text-1)" }}>
                {source.title}
              </p>
            )}
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-[11px] hover:underline"
                style={{ color: "var(--adm-accent-purple)" }}
              >
                {source.domain ?? source.url}
              </a>
            )}
            {source.note && (
              <p className="mt-0.5 text-[11px] italic" style={{ color: "var(--adm-text-3)" }}>
                {source.note}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void removeSource(source.id)}
            className="shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
            title="Remove source"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}

      {/* add form */}
      {showForm && (
        <div
          className="space-y-2 rounded-md p-3"
          style={{ background: "var(--adm-surface-2)", border: "1px solid var(--adm-border)" }}
        >
          <Input
            placeholder="https://source-url.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-7 text-xs"
          />
          <Input
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-7 text-xs"
          />
          <Input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-7 text-xs"
          />
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <div className="flex gap-2">
            <Button
              className="h-7 flex-1 text-xs"
              onClick={() => void addSource()}
              disabled={adding}
            >
              {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
            </Button>
            <Button
              variant="ghost"
              className="h-7 px-3 text-xs"
              onClick={() => { setShowForm(false); setFormError(null); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* add button */}
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-white/8"
          style={{ color: "var(--adm-accent-purple)" }}
        >
          <Plus className="h-3 w-3" />
          Add source
        </button>
      )}
    </div>
  );
}
