"use client";

import { useEffect, useState } from "react";
import { Bot, ChevronDown, Plus, RefreshCw, Zap, X } from "lucide-react";
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

// ─── types ────────────────────────────────────────────────────────────────────

type JobStatus = "queued" | "running" | "succeeded" | "failed" | "pending" | "retrying";
type JobFilter = "all" | "queued" | "running" | "succeeded" | "failed";

interface IngestionJob {
  id: string;
  type: string;
  status: JobStatus;
  input: string;
  error: string | null;
  source: { name: string; type: string } | null;
  createdAt: string;
  updatedAt: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: JobStatus }) {
  const toneMap: Record<JobStatus, "neutral" | "blue" | "green" | "red" | "amber"> = {
    queued: "neutral",
    pending: "neutral",
    running: "blue",
    retrying: "amber",
    succeeded: "green",
    failed: "red",
  };
  return <Badge tone={toneMap[status] ?? "neutral"}>{status}</Badge>;
}

function sourcePlaceholder(type: string): string {
  switch (type) {
    case "rss":
      return "https://feeds.example.com/rss.xml";
    case "url":
      return "https://example.com/article";
    case "scrape":
      return "https://example.com";
    case "youtube":
      return "https://youtube.com/watch?v=...";
    case "x_trend":
      return "#trending or @handle";
    default:
      return "Source URL or identifier";
  }
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// ─── component ────────────────────────────────────────────────────────────────

export default function IngestionPage() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState<JobFilter>("all");

  // create form
  const [newType, setNewType] = useState("rss");
  const [newSource, setNewSource] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // cancel confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobFilter]);

  // ─── fetch ────────────────────────────────────────────────────────────────

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const url =
        jobFilter !== "all"
          ? `/api/admin/ingestion?status=${jobFilter}`
          : "/api/admin/ingestion";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        ok: boolean;
        data: { jobs: IngestionJob[]; stats: Record<string, number>; total: number };
      };
      setJobs(json.data.jobs ?? []);
      setStats(json.data.stats ?? {});
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  // ─── submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!newSource.trim()) {
      setSubmitError("Source is required");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/admin/ingestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType, source: newSource.trim() }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        data?: { job: IngestionJob };
      };
      if (!res.ok) {
        setSubmitError(json.error ?? `HTTP ${res.status}`);
        return;
      }
      if (json.data?.job) {
        setJobs((prev) => [json.data!.job, ...prev]);
      }
      setNewSource("");
    } catch {
      setSubmitError("Failed to queue job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── cancel ───────────────────────────────────────────────────────────────

  const handleCancel = async (id: string) => {
    // Optimistically remove from local state
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setDeletingId(null);
  };

  // ─── render ───────────────────────────────────────────────────────────────

  const filterLabels: Record<JobFilter, string> = {
    all: "All",
    queued: "Queued",
    running: "Running",
    succeeded: "Succeeded",
    failed: "Failed",
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <section className="flex items-start gap-3">
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-emerald-400/20 bg-emerald-400/10">
          <Zap className="h-4 w-4 text-emerald-300" />
        </div>
        <div>
          <Badge tone="green">Ingestion</Badge>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Ingestion Hub
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Queue RSS feeds, URLs, and scrape jobs for the AI pipeline.
          </p>
        </div>
      </section>

      {/* stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            { key: "queued", label: "Queued", tone: "amber" },
            { key: "running", label: "Running", tone: "blue" },
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

      {/* job creation form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-zinc-400" />
            <CardTitle>Queue new job</CardTitle>
          </div>
          <CardDescription>
            Select a source type and provide the input URL or identifier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-300">
                Type
                <select
                  className="mt-2 w-full rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                >
                  <option value="rss">RSS Feed</option>
                  <option value="url">URL Import</option>
                  <option value="scrape">Website Scrape</option>
                  <option value="youtube">YouTube</option>
                  <option value="x_trend">X Trends</option>
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">
                Source
                <input
                  className="mt-2 w-full rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white/20 focus:outline-none"
                  placeholder={sourcePlaceholder(newType)}
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSubmit();
                  }}
                />
              </label>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
              <Plus className="h-4 w-4" />
              {isSubmitting ? "Queueing…" : "Queue job"}
            </Button>
          </div>
          {submitError && (
            <p className="mt-3 text-sm text-red-400">{submitError}</p>
          )}
        </CardContent>
      </Card>

      {/* jobs table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Job Queue</CardTitle>
              <CardDescription>
                {loading
                  ? "Loading…"
                  : `${jobs.length} job${jobs.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="h-8 gap-1 px-3 text-xs">
                    {filterLabels[jobFilter]}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-32.5 rounded-md border border-white/10 bg-zinc-900 p-1 shadow-xl">
                  {(Object.keys(filterLabels) as JobFilter[]).map((f) => (
                    <DropdownMenuItem
                      key={f}
                      className="cursor-pointer rounded px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/[0.07] hover:text-white focus:outline-none"
                      onSelect={() => setJobFilter(f)}
                    >
                      {filterLabels[f]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                className="h-8 w-8 px-0"
                onClick={() => void fetchJobs()}
                aria-label="Refresh jobs"
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
                  Job ID
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Type
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Status
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Input
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Source
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Created
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  &nbsp;
                </TableHead>
              </TableRow>
            </thead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-zinc-400"
                  >
                    Loading jobs…
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-zinc-400"
                  >
                    No jobs found. Queue one above.
                  </TableCell>
                </TableRow>
              ) : (
                jobs.flatMap((job) => {
                  const rows = [
                    <TableRow
                      key={job.id}
                      className="border-b border-white/5 hover:bg-white/3"
                    >
                      <TableCell className="px-4 py-3 font-mono text-xs text-zinc-300">
                        {job.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-zinc-300">
                        {job.type}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell
                        className="max-w-50 truncate px-4 py-3 text-sm text-zinc-400"
                        title={job.input}
                      >
                        {job.input}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-zinc-400">
                        {job.source ? job.source.name : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-zinc-500">
                        {fmtTime(job.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {(job.status === "queued" || job.status === "running") &&
                          deletingId !== job.id && (
                            <Button
                              variant="ghost"
                              className="h-7 w-7 px-0 text-red-400 hover:text-red-300"
                              aria-label="Cancel job"
                              onClick={() => setDeletingId(job.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>,
                  ];

                  if (deletingId === job.id) {
                    rows.push(
                      <TableRow
                        key={`${job.id}-confirm`}
                        className="border-b border-white/5 bg-zinc-900/60"
                      >
                        <TableCell colSpan={7} className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-zinc-300">
                              Cancel job{" "}
                              <span className="font-mono text-xs text-zinc-500">
                                {job.id.slice(0, 8)}
                              </span>
                              ?
                            </span>
                            <Button
                              variant="danger"
                              className="h-7 px-3 text-xs"
                              onClick={() => void handleCancel(job.id)}
                            >
                              Yes, cancel
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-7 px-3 text-xs"
                              onClick={() => setDeletingId(null)}
                            >
                              No, keep
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>,
                    );
                  }

                  return rows;
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
