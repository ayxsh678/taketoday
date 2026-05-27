"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BellOff, Check, RefreshCw } from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  title: string;
  message: string;
  kind: string;
  read: boolean;
  createdAt: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const KIND_DOT: Record<string, string> = {
  approval: "bg-amber-400",
  social: "bg-sky-400",
  trend: "bg-violet-400",
  ingestion: "bg-emerald-400",
  publishing: "bg-emerald-400",
};

function kindDotClass(kind: string): string {
  return KIND_DOT[kind] ?? "bg-zinc-400";
}

// ─── component ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  async function fetchNotifications() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        ok: boolean;
        data: { notifications: Notification[] };
      };
      setNotifications(json.data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchNotifications();
  }, []);

  async function handleMarkAll() {
    setIsMarkingAll(true);
    try {
      await fetch("/api/admin/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // no-op
    } finally {
      setIsMarkingAll(false);
    }
  }

  function handleMarkOne(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="space-y-8">
      {/* ── header ── */}
      <div>
        <Badge tone="blue">Notifications</Badge>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white lg:text-4xl">
          Notifications
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">
          System alerts, approval requests, and pipeline updates.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="h-40 animate-pulse rounded-lg bg-white/4" />
        </Card>
      ) : error ? (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : (
        <Card>
          {/* ── controls row ── */}
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                  filter === "all"
                    ? "border-white/25 bg-white/10 text-white"
                    : "border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                  filter === "unread"
                    ? "border-white/25 bg-white/10 text-white"
                    : "border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="rounded-full border border-sky-400/30 bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-300">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            <Button
              variant="secondary"
              onClick={handleMarkAll}
              disabled={unreadCount === 0 || isMarkingAll}
              className="h-8 px-2.5 text-xs"
            >
              {isMarkingAll ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {isMarkingAll ? "Marking…" : "Mark all read"}
            </Button>
          </CardHeader>

          {/* ── notification list ── */}
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-500">
                <BellOff className="h-8 w-8 opacity-40" />
                <p className="text-sm">
                  {filter === "unread"
                    ? "No unread notifications."
                    : "No notifications yet."}
                </p>
              </div>
            ) : (
              <ul>
                {filteredNotifications.map((n, i) => (
                  <li
                    key={n.id}
                    onClick={() => !n.read && handleMarkOne(n.id)}
                    className={`flex cursor-pointer items-start gap-3 px-4 py-3.5 transition hover:bg-white/3 ${
                      i < filteredNotifications.length - 1
                        ? "border-b border-white/10"
                        : ""
                    }`}
                  >
                    {/* colored kind dot */}
                    <div className="mt-1.5 shrink-0">
                      <span
                        className={`block h-2 w-2 rounded-full ${kindDotClass(n.kind)}`}
                      />
                    </div>

                    {/* text content */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          n.read ? "text-zinc-400" : "text-white"
                        }`}
                      >
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-400">{n.message}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>

                    {/* unread indicator dot */}
                    {!n.read && (
                      <div className="mt-1.5 shrink-0">
                        <span className="block h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
