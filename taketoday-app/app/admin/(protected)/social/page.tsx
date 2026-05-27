"use client";

import { useEffect, useState } from "react";
import { Calendar, Check, ChevronDown, Globe, RefreshCw, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── constants ────────────────────────────────────────────────────────────────

const PLATFORMS = ["X", "Instagram", "WhatsApp", "Telegram", "Facebook", "LinkedIn", "YouTube"];

// ─── types ────────────────────────────────────────────────────────────────────

type PostStatus = "queued" | "succeeded" | "failed";
type PostFilter = "all" | "queued" | "succeeded" | "failed";

interface SocialPost {
  id: string;
  platform: string;
  copy: string;
  status: PostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  retryCount: number;
  lastError: string | null;
  createdAt: string;
  articleId: string | null;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PostStatus }) {
  const toneMap: Record<PostStatus, "neutral" | "green" | "red"> = {
    queued: "neutral",
    succeeded: "green",
    failed: "red",
  };
  return <Badge tone={toneMap[status] ?? "neutral"}>{status}</Badge>;
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// ─── component ────────────────────────────────────────────────────────────────

export default function SocialPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postFilter, setPostFilter] = useState<PostFilter>("all");

  // composer
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [copy, setCopy] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  useEffect(() => {
    void fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postFilter]);

  // ─── fetch ────────────────────────────────────────────────────────────────

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const url =
        postFilter !== "all"
          ? `/api/admin/social?status=${postFilter}`
          : "/api/admin/social";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        ok: boolean;
        data: { posts: SocialPost[]; stats: Record<string, number>; total: number };
      };
      setPosts(json.data.posts ?? []);
      setStats(json.data.stats ?? {});
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  // ─── compose ──────────────────────────────────────────────────────────────

  const handleCompose = async () => {
    if (selectedPlatforms.length === 0) {
      setComposeError("Select at least one platform");
      return;
    }
    if (!copy.trim()) {
      setComposeError("Copy is required");
      return;
    }
    setIsComposing(true);
    setComposeError(null);
    try {
      const res = await fetch("/api/admin/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          copy: copy.trim(),
          scheduledAt: scheduledAt || undefined,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        data?: { posts: SocialPost[] };
      };
      if (!res.ok) {
        setComposeError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      if (json.data?.posts) {
        setPosts((prev) => [...json.data!.posts, ...prev]);
      }
      setSelectedPlatforms([]);
      setCopy("");
      setScheduledAt("");
    } catch {
      setComposeError("Failed to compose post. Please try again.");
    } finally {
      setIsComposing(false);
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  // ─── render ───────────────────────────────────────────────────────────────

  const filterLabels: Record<PostFilter, string> = {
    all: "All",
    queued: "Queued",
    succeeded: "Succeeded",
    failed: "Failed",
  };

  const copyLen = copy.length;

  return (
    <div className="space-y-6">
      {/* header */}
      <section className="flex items-start gap-3">
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-violet-400/20 bg-violet-400/10">
          <Globe className="h-4 w-4 text-violet-300" />
        </div>
        <div>
          <Badge tone="violet">Social</Badge>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Social Hub
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Compose, schedule, and track social posts across all platforms.
          </p>
        </div>
      </section>

      {/* stats row */}
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            { key: "queued", label: "Queued", tone: "neutral" },
            { key: "succeeded", label: "Succeeded", tone: "green" },
            { key: "failed", label: "Failed", tone: "red" },
          ] as const
        ).map(({ key, label, tone }) => (
          <div
            key={key}
            className="rounded-lg border border-white/10 bg-white/5.5 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-400">{label}</span>
              <Badge tone={tone}>{label}</Badge>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {stats[key] ?? 0}
            </p>
          </div>
        ))}
      </div>

      {/* composer */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-zinc-400" />
            <CardTitle>New post</CardTitle>
          </div>
          <CardDescription>
            Select platforms, write your copy, and optionally schedule a publish time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* platform pills */}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">Platforms</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const active = selectedPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-transparent text-zinc-400 hover:border-white/20 hover:text-zinc-200",
                    ].join(" ")}
                  >
                    {active && <Check className="h-3 w-3" />}
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* copy textarea */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Copy</label>
              <span
                className={[
                  "text-xs",
                  copyLen > 280 ? "text-amber-400" : "text-zinc-500",
                ].join(" ")}
              >
                {copyLen} / 280
              </span>
            </div>
            <textarea
              className="w-full resize-none rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white/20 focus:outline-none"
              rows={4}
              placeholder="What's happening?"
              value={copy}
              onChange={(e) => setCopy(e.target.value)}
            />
          </div>

          {/* schedule */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                Schedule for{" "}
                <span className="font-normal text-zinc-500">(optional)</span>
              </span>
              <input
                type="datetime-local"
                className="mt-2 w-full rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </label>
          </div>

          {/* submit */}
          <div>
            <Button
              onClick={() => void handleCompose()}
              disabled={isComposing || selectedPlatforms.length === 0 || !copy.trim()}
            >
              <Send className="h-4 w-4" />
              {isComposing ? "Composing…" : "Compose"}
            </Button>
          </div>
          {composeError && (
            <p className="text-sm text-red-400">{composeError}</p>
          )}
        </CardContent>
      </Card>

      {/* posts table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Posts</CardTitle>
              <CardDescription>
                {loading
                  ? "Loading…"
                  : `${posts.length} post${posts.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="h-8 gap-1 px-3 text-xs">
                    {filterLabels[postFilter]}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-32.5 rounded-md border border-white/10 bg-zinc-900 p-1 shadow-xl">
                  {(Object.keys(filterLabels) as PostFilter[]).map((f) => (
                    <DropdownMenuItem
                      key={f}
                      className="cursor-pointer rounded px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/[0.07] hover:text-white focus:outline-none"
                      onSelect={() => setPostFilter(f)}
                    >
                      {filterLabels[f]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                className="h-8 w-8 px-0"
                onClick={() => void fetchPosts()}
                aria-label="Refresh posts"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <p className="px-4 py-3 text-sm text-red-400">{error}</p>
          )}
          <Table>
            <thead className="border-b border-white/10 bg-white/3">
              <TableRow className="border-0 hover:bg-transparent has-aria-expanded:bg-transparent">
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  ID
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Platform
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Status
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Copy
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Scheduled
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Created
                </TableHead>
              </TableRow>
            </thead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-zinc-400"
                  >
                    Loading posts…
                  </TableCell>
                </TableRow>
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-zinc-400"
                  >
                    No posts found. Compose one above.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow
                    key={post.id}
                    className="border-b border-white/5 hover:bg-white/3"
                  >
                    <TableCell className="px-4 py-3 font-mono text-xs text-zinc-300">
                      {post.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-zinc-300">
                      {post.platform}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={post.status} />
                    </TableCell>
                    <TableCell
                      className="max-w-60 truncate px-4 py-3 text-sm text-zinc-400"
                      title={post.copy}
                    >
                      {post.copy.length > 60
                        ? `${post.copy.slice(0, 60)}…`
                        : post.copy}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-zinc-500">
                      {fmtTime(post.scheduledAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-zinc-500">
                      {fmtTime(post.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
