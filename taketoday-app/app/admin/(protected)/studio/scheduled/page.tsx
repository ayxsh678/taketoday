"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";

type ScheduledPost = {
  id: string;
  platform: string;
  content: string;
  scheduledAt: string | null;
  status: "PENDING" | "POSTED" | "FAILED";
  platformPostId: string | null;
  errorMessage: string | null;
  postedAt: string | null;
  createdAt: string;
  draft: { topic: string; type: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  POSTED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const PLATFORM_ICONS: Record<string, string> = {
  INSTAGRAM: "📸",
  TWITTER: "🐦",
  LINKEDIN: "💼",
  WHATSAPP: "💬",
};

export default function ScheduledPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchPosts = useCallback(async () => {
    try {
      const url = statusFilter === "all" ? "/api/studio/scheduled" : `/api/studio/scheduled?status=${statusFilter}`;
      const resp = await fetch(url);
      const json = (await resp.json()) as { ok: boolean; data: { posts: ScheduledPost[] } };
      if (json.ok) setPosts(json.data.posts);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchPosts();
    const interval = setInterval(fetchPosts, 30_000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await fetch(`/api/studio/scheduled?id=${id}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setCancelling(null);
    }
  };

  const fmt = (dt: string | null) => {
    if (!dt) return "—";
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(dt));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scheduled Posts</h1>
          <p className="text-muted-foreground text-sm mt-1">Auto-refreshes every 30 seconds.</p>
        </div>
        <button
          onClick={fetchPosts}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm"
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "PENDING", "POSTED", "FAILED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm border ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}
          >
            {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No posts found.</div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Platform</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Content</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Scheduled</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span>{PLATFORM_ICONS[post.platform] ?? "🔗"}</span>
                      <span className="text-xs font-medium">{post.platform}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    {post.draft && (
                      <p className="text-xs text-muted-foreground mb-0.5">{post.draft.topic}</p>
                    )}
                    <p className="truncate text-sm">{post.content.slice(0, 80)}{post.content.length > 80 ? "…" : ""}</p>
                    {post.errorMessage && (
                      <p className="text-xs text-destructive mt-0.5">{post.errorMessage}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {post.scheduledAt ? fmt(post.scheduledAt) : "Immediate"}
                    {post.postedAt && <span className="block text-green-600">Posted: {fmt(post.postedAt)}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[post.status] ?? ""}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {post.status === "PENDING" && (
                      <button
                        onClick={() => handleCancel(post.id)}
                        disabled={cancelling === post.id}
                        className="flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
                      >
                        <Trash2 className="size-3" />
                        {cancelling === post.id ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                    {post.platformPostId && (
                      <span className="text-xs text-muted-foreground">ID: {post.platformPostId}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
