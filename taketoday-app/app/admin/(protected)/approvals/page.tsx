"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  MessageSquare,
  X,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ─── types ────────────────────────────────────────────────────────────────────

type ArticleStatus = "approved" | "draft" | "under_review" | "published";

interface ArticleComment {
  id: string;
  body: string;
  author: string;
  createdAt: string;
}

interface Article {
  id: string;
  headline: string;
  subheadline: string | null;
  slug: string;
  status: ArticleStatus;
  breaking: boolean;
  priorityScore: number;
  author: string;
  category: string;
  tags: string[];
  recentComments: ArticleComment[];
  createdAt: string;
  updatedAt: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ArticleStatus }) {
  const toneMap: Record<ArticleStatus, "blue" | "neutral" | "amber" | "green"> = {
    approved: "blue",
    draft: "neutral",
    under_review: "amber",
    published: "green",
  };
  return <Badge tone={toneMap[status] ?? "neutral"}>{status.replace("_", " ")}</Badge>;
}

function relativeTime(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? "just now" : `${diffMins} minutes ago`;
      }
      return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    }
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  } catch {
    return iso;
  }
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const [pending, setPending] = useState<Article[]>([]);
  const [recentlyProcessed, setRecentlyProcessed] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // decision state
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    void fetchPending();
  }, []);

  // ─── fetch ────────────────────────────────────────────────────────────────

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/approvals");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        ok: boolean;
        data: {
          pending: Article[];
          recentlyProcessed: Article[];
          pendingCount: number;
        };
      };
      setPending(json.data.pending ?? []);
      setRecentlyProcessed(json.data.recentlyProcessed ?? []);
      setPendingCount(json.data.pendingCount ?? 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch approvals");
    } finally {
      setLoading(false);
    }
  };

  // ─── decision ─────────────────────────────────────────────────────────────

  const handleDecision = async (articleId: string, dec: "approve" | "reject") => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          decision: dec,
          comment: comment.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok) {
        setSubmitError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      const article = pending.find((a) => a.id === articleId);
      setPending((prev) => prev.filter((a) => a.id !== articleId));
      setPendingCount((c) => Math.max(0, c - 1));
      if (article) {
        setRecentlyProcessed((prev) => [
          { ...article, status: dec === "approve" ? "approved" : "draft" },
          ...prev,
        ]);
      }
      setDecidingId(null);
      setDecision(null);
      setComment("");
    } catch {
      setSubmitError("Failed to submit decision. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startReview = (id: string) => {
    setDecidingId(id);
    setDecision(null);
    setComment("");
    setSubmitError(null);
  };

  const cancelReview = () => {
    setDecidingId(null);
    setDecision(null);
    setComment("");
    setSubmitError(null);
  };

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* header */}
      <section>
        <Badge tone="amber">Approvals</Badge>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          Approvals
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Review articles submitted for editorial approval.
        </p>
        {!loading && (
          <p className="mt-2 text-xs text-zinc-500">
            {pendingCount} article{pendingCount !== 1 ? "s" : ""} awaiting review
          </p>
        )}
      </section>

      {/* error */}
      {error && (
        <p className="rounded-md border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* loading */}
      {loading && (
        <p className="text-sm text-zinc-400">Loading…</p>
      )}

      {/* empty state */}
      {!loading && pending.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400/60" />
            <p className="font-medium text-white">All caught up!</p>
            <p className="text-sm text-zinc-400">No articles pending review.</p>
          </CardContent>
        </Card>
      )}

      {/* pending articles */}
      {!loading && pending.length > 0 && (
        <div className="space-y-4">
          {pending.map((article) => {
            const isDeciding = decidingId === article.id;
            return (
              <Card key={article.id}>
                <CardContent className="p-5">
                  {/* top row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-white leading-snug">
                          {article.headline}
                        </h2>
                        {article.breaking && (
                          <Badge tone="red">Breaking</Badge>
                        )}
                        <span className="text-xs text-zinc-500">
                          Priority: {article.priorityScore}
                        </span>
                      </div>
                      {article.subheadline && (
                        <p className="mt-1 text-sm text-zinc-400">
                          {article.subheadline}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* meta */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                    <span>{article.author}</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>{article.category}</span>
                    {article.tags.length > 0 && (
                      <>
                        <ChevronRight className="h-3 w-3" />
                        <span>{article.tags.join(", ")}</span>
                      </>
                    )}
                  </div>

                  {/* submitted time */}
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    <span>Submitted {relativeTime(article.createdAt)}</span>
                  </div>

                  {/* recent comments */}
                  {article.recentComments.length > 0 && (
                    <div className="mt-3 rounded-md border border-white/8 bg-white/3 p-3">
                      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                        <MessageSquare className="h-3 w-3" />
                        Recent comment
                      </div>
                      <p className="text-sm text-zinc-300 line-clamp-2">
                        {article.recentComments[0].body}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {article.recentComments[0].author} ·{" "}
                        {relativeTime(article.recentComments[0].createdAt)}
                      </p>
                    </div>
                  )}

                  {/* decision UI */}
                  {isDeciding ? (
                    <div className="mt-4 space-y-3 rounded-md border border-white/10 bg-white/3 p-4">
                      {/* approve / reject buttons */}
                      {!decision && (
                        <div className="flex items-center gap-3">
                          <Button
                            className="h-8 gap-1.5 bg-emerald-600 px-4 text-xs text-white hover:bg-emerald-500"
                            onClick={() => setDecision("approve")}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            className="h-8 gap-1.5 px-4 text-xs"
                            onClick={() => setDecision("reject")}
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                          <Button
                            variant="ghost"
                            className="ml-auto h-8 px-3 text-xs"
                            onClick={cancelReview}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}

                      {/* comment + confirm */}
                      {decision && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            {decision === "approve" ? (
                              <Badge tone="green">Approving</Badge>
                            ) : (
                              <Badge tone="red">Rejecting</Badge>
                            )}
                            <button
                              type="button"
                              className="text-xs text-zinc-500 hover:text-zinc-300"
                              onClick={() => setDecision(null)}
                            >
                              Change
                            </button>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-300">
                              Comment{" "}
                              <span className="font-normal text-zinc-500">
                                (optional)
                              </span>
                              <textarea
                                className="mt-1.5 w-full resize-none rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white/20 focus:outline-none"
                                rows={3}
                                placeholder="Leave a note for the author…"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                              />
                            </label>
                          </div>
                          {submitError && (
                            <p className="text-sm text-red-400">{submitError}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <Button
                              className={
                                decision === "approve"
                                  ? "h-8 gap-1.5 bg-emerald-600 px-4 text-xs text-white hover:bg-emerald-500"
                                  : "h-8 gap-1.5 bg-red-600 px-4 text-xs text-white hover:bg-red-500"
                              }
                              disabled={isSubmitting}
                              onClick={() => void handleDecision(article.id, decision)}
                            >
                              {isSubmitting
                                ? "Submitting…"
                                : decision === "approve"
                                ? "Confirm approve"
                                : "Confirm reject"}
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-8 px-3 text-xs"
                              disabled={isSubmitting}
                              onClick={cancelReview}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <Button
                        variant="secondary"
                        className="h-8 gap-1.5 px-3 text-xs"
                        onClick={() => startReview(article.id)}
                      >
                        Review
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* recently processed */}
      {!loading && recentlyProcessed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">
            Recently processed
          </h2>
          <div className="space-y-2">
            {recentlyProcessed.map((article) => (
              <div
                key={article.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-white/8 bg-white/3 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {article.status === "approved" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    )}
                    <span className="truncate text-sm font-medium text-white">
                      {article.headline}
                    </span>
                    <StatusBadge status={article.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {article.author} · {relativeTime(article.updatedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
