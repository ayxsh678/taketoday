"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Edit3, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminArticle } from "@/lib/admin/types";

const statusTone = {
  draft: "neutral",
  scheduled: "violet",
  published: "green",
  archived: "red",
} as const;

interface ArticleTableProps {
  queryParams?: { q?: string; status?: string };
}

const PAGE_SIZE = 20;

export function ArticleTable({ queryParams }: ArticleTableProps = {}) {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { setPage(1); }, [queryParams?.q, queryParams?.status]);

  useEffect(() => { void fetchArticles(); }, [page, queryParams?.q, queryParams?.status]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/admin/articles", window.location.origin);
      if (queryParams?.q) url.searchParams.set("q", queryParams.q);
      if (queryParams?.status) url.searchParams.set("status", queryParams.status);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(PAGE_SIZE));
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json.data as { articles: AdminArticle[]; total: number; totalPages: number };
      setArticles(data.articles ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch articles");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-120 text-left text-sm">
          <thead className="bg-white/4 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Story</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">Loading…</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-red-400">{error}</td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">No articles found</td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="hover:bg-white/3">
                  <td className="max-w-sm px-4 py-4">
                    <p className="font-medium text-white">{article.headline}</p>
                    {article.excerpt && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{article.excerpt}</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={statusTone[article.status]}>
                      {article.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-zinc-300">{article.category}</td>
                  <td className="px-4 py-4 text-zinc-300">{article.author}</td>
                  <td className="px-4 py-4 text-right">
                    {deletingId === article.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-zinc-400">Delete?</span>
                        <Button
                          variant="danger"
                          className="h-7 px-2 text-xs"
                          onClick={() => void confirmDelete(article.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "…" : "Yes"}
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => setDeletingId(null)}
                          disabled={isDeleting}
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          className="h-8 w-8 px-0"
                          aria-label="Preview"
                          onClick={() => window.open(`/article/${article.slug}`, "_blank", "noopener,noreferrer")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Link
                          href={`/admin/content/${article.id}/edit`}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white/6 hover:text-white"
                          aria-label="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 px-0 text-red-400 hover:text-red-300"
                          aria-label="Delete"
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 pt-3">
          <p className="text-xs text-zinc-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              className="h-8 w-8 px-0"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-12 text-center text-xs text-zinc-400">{page} / {totalPages}</span>
            <Button
              variant="ghost"
              className="h-8 w-8 px-0"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
