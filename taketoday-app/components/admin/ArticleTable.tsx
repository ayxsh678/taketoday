"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Edit3, Eye, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { AdminArticle, WorkflowStatus } from "@/lib/admin/types";

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: WorkflowStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const statusTone = {
  draft: "neutral",
  under_review: "amber",
  approved: "blue",
  scheduled: "violet",
  published: "green",
  archived: "red",
} as const;

// ─── types ────────────────────────────────────────────────────────────────────

type DraftFields = {
  headline: string;
  subheadline: string;
  status: WorkflowStatus;
  priorityScore: number;
  breaking: boolean;
  seoTitle: string;
  seoDescription: string;
};

function articleToDraft(a: AdminArticle): DraftFields {
  return {
    headline: a.headline,
    subheadline: a.subheadline,
    status: a.status,
    priorityScore: a.priorityScore,
    breaking: a.breaking,
    seoTitle: a.seoTitle,
    seoDescription: a.seoDescription,
  };
}

// ─── styled select ────────────────────────────────────────────────────────────

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-white/10 bg-zinc-900 px-3 pr-8 text-sm text-white outline-none transition focus:border-white/25"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-zinc-400" />
    </div>
  );
}

// ─── component ───────────────────────────────────────────────────────────────

interface ArticleTableProps {
  /** Optional server-side filter params. When changed, triggers a re-fetch. */
  queryParams?: { q?: string; status?: string };
}

export function ArticleTable({ queryParams }: ArticleTableProps = {}) {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // edit modal
  const [selectedArticle, setSelectedArticle] = useState<AdminArticle | null>(null);
  const [draft, setDraft] = useState<DraftFields | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // inline delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Re-fetch when query params change
  useEffect(() => {
    void fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams?.q, queryParams?.status]);

  // ─── data fetching ──────────────────────────────────────────────────────────

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/admin/articles", window.location.origin);
      if (queryParams?.q) url.searchParams.set("q", queryParams.q);
      if (queryParams?.status) url.searchParams.set("status", queryParams.status);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // API wraps in { ok: true, data: { articles: [...] } }
      setArticles((json.data as { articles: AdminArticle[] }).articles ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch articles");
    } finally {
      setLoading(false);
    }
  };

  // ─── edit handlers ──────────────────────────────────────────────────────────

  const openEditor = (article: AdminArticle) => {
    setSelectedArticle(article);
    setDraft(articleToDraft(article));
    setSaveError(null);
  };

  const closeEditor = () => {
    setSelectedArticle(null);
    setDraft(null);
    setSaveError(null);
  };

  const patchDraft = (patch: Partial<DraftFields>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleSave = async () => {
    if (!selectedArticle || !draft) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/admin/articles/${selectedArticle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: draft.headline,
          subheadline: draft.subheadline,
          status: draft.status,
          priorityScore: draft.priorityScore,
          breaking: draft.breaking,
          seoTitle: draft.seoTitle,
          seoDescription: draft.seoDescription,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSaveError((json as { error?: string }).error ?? `HTTP ${res.status}`);
        return;
      }

      // Replace the article in local state with the authoritative server response
      const updated = (json.data as { article: AdminArticle }).article;
      setArticles((prev) =>
        prev.map((a) => (a.id === selectedArticle.id ? updated : a)),
      );
      closeEditor();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── delete handlers ────────────────────────────────────────────────────────

  const confirmDelete = async (articleId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        alert((json as { error?: string }).error ?? "Delete failed");
        return;
      }
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      setDeletingId(null);
    } catch {
      alert("Delete failed. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── table ── */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="bg-white/4 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Story</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Desk</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  Loading articles…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-red-400">
                  {error}
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No articles found
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="hover:bg-white/3">
                  <td className="max-w-md px-4 py-4">
                    <p className="font-medium text-white">{article.headline}</p>
                    <p className="mt-1 line-clamp-1 text-zinc-500">{article.subheadline}</p>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={statusTone[article.status]}>
                      {article.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-zinc-300">{article.category}</td>
                  <td className="px-4 py-4 text-zinc-300">{article.priorityScore}</td>
                  <td className="px-4 py-4 text-zinc-300">{article.author}</td>
                  <td className="px-4 py-4 text-right">
                    {deletingId === article.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-zinc-400">Confirm delete?</span>
                        <Button
                          variant="danger"
                          className="h-7 px-2 text-xs"
                          onClick={() => void confirmDelete(article.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "…" : "Delete"}
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => setDeletingId(null)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          className="h-8 w-8 px-0"
                          aria-label={`Preview ${article.headline}`}
                          onClick={() =>
                            window.open(`/article/${article.slug}`, "_blank", "noopener,noreferrer")
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 px-0"
                          aria-label={`Edit ${article.headline}`}
                          onClick={() => openEditor(article)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 px-0 text-red-400 hover:text-red-300"
                          aria-label={`Delete ${article.headline}`}
                          onClick={() => setDeletingId(article.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── edit modal ── */}
      {selectedArticle && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-zinc-950 shadow-2xl">
            {/* header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Article editor
                </p>
                <h2 className="mt-1 font-mono text-sm text-zinc-300">{selectedArticle.slug}</h2>
              </div>
              <Button
                variant="ghost"
                className="h-8 w-8 px-0"
                aria-label="Close editor"
                onClick={closeEditor}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* body */}
            <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
              {saveError && (
                <p className="rounded-md border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                  {saveError}
                </p>
              )}

              <label className="block text-sm font-medium text-zinc-300">
                Headline
                <Input
                  className="mt-2"
                  value={draft.headline}
                  onChange={(e) => patchDraft({ headline: e.target.value })}
                />
              </label>

              <label className="block text-sm font-medium text-zinc-300">
                Subheadline
                <Textarea
                  className="mt-2 min-h-20"
                  value={draft.subheadline}
                  onChange={(e) => patchDraft({ subheadline: e.target.value })}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Status
                  <div className="mt-2">
                    <Select
                      value={draft.status}
                      onChange={(v) => patchDraft({ status: v as WorkflowStatus })}
                      options={STATUS_OPTIONS}
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium text-zinc-300">
                  Priority score
                  <Input
                    className="mt-2"
                    type="number"
                    min={0}
                    max={100}
                    value={draft.priorityScore}
                    onChange={(e) =>
                      patchDraft({
                        priorityScore: Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)),
                      })
                    }
                  />
                </label>
              </div>

              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-zinc-300">
                <input
                  type="checkbox"
                  checked={draft.breaking}
                  onChange={(e) => patchDraft({ breaking: e.target.checked })}
                  className="h-4 w-4 rounded border-white/20 bg-zinc-900 accent-white"
                />
                Breaking news
              </label>

              {/* read-only meta */}
              <div className="grid gap-3 rounded-lg border border-white/10 bg-white/3 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-zinc-500">Category</p>
                  <p className="mt-1 text-white">{selectedArticle.category}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Author</p>
                  <p className="mt-1 text-white">{selectedArticle.author}</p>
                </div>
              </div>

              {/* SEO */}
              <details className="group">
                <summary className="cursor-pointer select-none text-sm font-medium text-zinc-400 hover:text-zinc-200">
                  SEO metadata ▸
                </summary>
                <div className="mt-3 space-y-4">
                  <label className="block text-sm font-medium text-zinc-300">
                    SEO title <span className="text-zinc-500">(max 70 chars)</span>
                    <Input
                      className="mt-2"
                      maxLength={70}
                      value={draft.seoTitle}
                      onChange={(e) => patchDraft({ seoTitle: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm font-medium text-zinc-300">
                    SEO description <span className="text-zinc-500">(max 160 chars)</span>
                    <Textarea
                      className="mt-2 min-h-16"
                      maxLength={160}
                      value={draft.seoDescription}
                      onChange={(e) => patchDraft({ seoDescription: e.target.value })}
                    />
                  </label>
                </div>
              </details>
            </div>

            {/* footer */}
            <div className="flex justify-end gap-2 border-t border-white/10 p-5">
              <Button variant="secondary" onClick={closeEditor} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={() => void handleSave()} disabled={isSaving}>
                {isSaving ? (
                  "Saving…"
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
