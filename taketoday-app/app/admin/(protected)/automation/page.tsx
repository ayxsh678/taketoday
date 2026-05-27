"use client";

import { useState, useEffect, useCallback } from "react";
import { useAutomationService } from "@/lib/python/client";
import type { AutomationStats } from "@/lib/python/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Bot, Clock, Edit3, LayoutGrid, Search, Trash2, X, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

import type { Job, Source } from "@/lib/python/client";

// ─── types ────────────────────────────────────────────────────────────────────

type JobFilter = "all" | "running" | "completed" | "failed";

// ─── helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "queued":
    case "pending":
      return <Badge tone="neutral">{status.toUpperCase()}</Badge>;
    case "running":
      return <Badge tone="blue">{status.toUpperCase()}</Badge>;
    case "succeeded":
    case "success":
      return <Badge tone="green">{status.toUpperCase()}</Badge>;
    case "failed":
    case "error":
      return <Badge tone="red">{status.toUpperCase()}</Badge>;
    case "retrying":
      return <Badge tone="amber">{status.toUpperCase()}</Badge>;
    default:
      return <Badge tone="neutral">{status}</Badge>;
  }
}

function filterJobs(jobs: Job[], filter: JobFilter): Job[] {
  switch (filter) {
    case "running":
      return jobs.filter((j) => j.status === "RUNNING" || j.status === "QUEUED");
    case "completed":
      return jobs.filter((j) => j.status === "SUCCEEDED");
    case "failed":
      return jobs.filter((j) => j.status === "FAILED" || j.status === "RETRYING");
    default:
      return jobs;
  }
}

function jobDuration(job: Job): string {
  if (!job.startedAt) return "—";
  const end = job.completedAt ? new Date(job.completedAt) : new Date();
  const secs = Math.floor((end.getTime() - new Date(job.startedAt).getTime()) / 1000);
  return `${secs}s`;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  // filters
  const [jobFilter, setJobFilter] = useState<JobFilter>("all");

  // job detail panel
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // cancel confirm
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // source delete confirm
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);
  const [isDeletingSource, setIsDeletingSource] = useState(false);

  // source edit modal
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [editSourceName, setEditSourceName] = useState("");

  // add source form
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceType, setNewSourceType] = useState("rss");

  const router = useRouter();
  const { client, loading, error, execute } = useAutomationService();

  // ── data loading ────────────────────────────────────────────────────────────

  const loadJobs = useCallback(async () => {
    return execute(async () => {
      const data = await client.getJobs();
      setJobs(data.jobs ?? []);
    });
  }, [client, execute]);

  const loadSources = useCallback(async () => {
    return execute(async () => {
      const data = await client.getSources();
      setSources(data.sources ?? []);
    });
  }, [client, execute]);

  const loadStats = useCallback(async () => {
    try {
      const data = await client.getStats();
      setStats(data);
    } catch {
      // Stats are DB-sourced; don't crash if Python service is down
    }
  }, [client]);

  useEffect(() => {
    void loadJobs();
    void loadSources();
    void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── pipeline actions ────────────────────────────────────────────────────────

  const handleRunFullPipeline = async () => {
    setIsRunning(true);
    try {
      await execute(async () => {
        await client.runFullPipeline();
        setTimeout(() => {
          void loadJobs();
          setIsRunning(false);
        }, 2000);
      });
    } catch {
      setIsRunning(false);
    }
  };

  const handleScrapeSources = async () => {
    setIsScraping(true);
    try {
      await execute(async () => {
        await client.scrapeSources();
        setTimeout(() => {
          void loadJobs();
          void loadSources();
          setIsScraping(false);
        }, 3000);
      });
    } catch {
      setIsScraping(false);
    }
  };

  // ── job actions ─────────────────────────────────────────────────────────────

  const handleCancelJob = async (jobId: string) => {
    setIsCancelling(true);
    try {
      await client.cancelJob(jobId);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "FAILED" } : j)),
      );
      setCancellingJobId(null);
    } catch {
      // Python service may not support cancel; optimistic update still clears UI
      setCancellingJobId(null);
    } finally {
      setIsCancelling(false);
    }
  };

  // ── source actions ──────────────────────────────────────────────────────────

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName || !newSourceUrl) return;
    try {
      await execute(async () => {
        await client.createSource({
          name: newSourceName,
          url: newSourceUrl,
          type: newSourceType,
          active: true,
          trustScore: 50,
          trustedCategories: [],
        });
        setNewSourceName("");
        setNewSourceUrl("");
        setNewSourceType("rss");
        void loadSources();
      });
    } catch {
      // error shown via hook
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    setIsDeletingSource(true);
    try {
      await client.deleteSource(sourceId);
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
      setDeletingSourceId(null);
    } catch {
      setDeletingSourceId(null);
    } finally {
      setIsDeletingSource(false);
    }
  };

  const openEditSource = (source: Source) => {
    setEditingSource(source);
    setEditSourceName(source.name);
  };

  const handleEditSourceSave = () => {
    if (!editingSource) return;
    // Optimistic local update — full edit flow would call PATCH /sources/:id
    setSources((prev) =>
      prev.map((s) => (s.id === editingSource.id ? { ...s, name: editSourceName } : s)),
    );
    setEditingSource(null);
  };

  // ── derived ─────────────────────────────────────────────────────────────────

  const filteredJobs = filterJobs(jobs, jobFilter);
  const filterLabel: Record<JobFilter, string> = {
    all: "All Jobs",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
  };

  if (loading && jobs.length === 0 && sources.length === 0) {
    return (
      <div className="space-y-6">
        <div className="py-12 text-center">
          <Bot className="mx-auto mb-4 h-10 w-10 text-zinc-400" />
          <p className="text-zinc-400">Loading automation dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── header ── */}
      <div className="flex flex-col items-start justify-between gap-6 xl:flex-row xl:items-center">
        <div className="flex-1">
          <Badge tone="blue">Automation</Badge>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white lg:text-4xl">
            Automation Hub
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">
            Scheduled scraping, AI processing, and deliverable generation with single-click
            pipeline execution.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => void handleRunFullPipeline()}
            disabled={isRunning || loading}
            variant="primary"
            className="px-6 py-3"
          >
            {isRunning ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Running Pipeline…
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Run Full Pipeline
              </>
            )}
          </Button>
          <Button
            onClick={() => void handleScrapeSources()}
            disabled={isScraping || loading}
            variant="secondary"
            className="px-6 py-3"
          >
            {isScraping ? (
              <>
                <Bot className="mr-2 h-4 w-4 animate-spin" />
                Scraping…
              </>
            ) : (
              <>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Scrape Sources
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── status cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* System status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Automation service health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Service</span>
              <span className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ${
                    loading
                      ? "animate-pulse bg-yellow-400"
                      : !error
                        ? "bg-green-400"
                        : "bg-red-400"
                  }`}
                />
                <span className="text-xs">
                  {loading ? "Starting…" : error ? "Offline" : "Online"}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Queue depth</span>
              <span className="font-mono text-xs text-zinc-200">
                {jobs.filter((j) => j.status === "QUEUED" || j.status === "RUNNING").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Sources active</span>
              <span className="font-mono text-xs text-zinc-200">
                {sources.filter((s) => s.active).length}/{sources.length}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Sources card */}
        <Card>
          <CardHeader>
            <CardTitle>Sources</CardTitle>
            <CardDescription>Configured news sources for scraping</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Active</span>
              <span className="font-mono text-xs text-zinc-200">
                {sources.filter((s) => s.active).length}/{sources.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Last scrape</span>
              <span className="text-xs text-zinc-400">
                {(() => {
                  const latest = sources.reduce<Date>(
                    (best, s) =>
                      s.lastScraped && new Date(s.lastScraped) > best
                        ? new Date(s.lastScraped)
                        : best,
                    new Date(0),
                  );
                  return latest.getTime() === 0
                    ? "Never"
                    : latest.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                })()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Total articles</span>
              <span className="font-mono text-xs text-zinc-200">
                {sources.reduce((t, s) => t + (s.articles?.length ?? 0), 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Today's output — real DB data */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Output</CardTitle>
            <CardDescription>AI-generated content and deliverables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Articles</span>
              <span className="font-mono text-xs text-zinc-200">
                {stats?.today.articles ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Social posts</span>
              <span className="font-mono text-xs text-zinc-200">
                {stats?.today.socialPosts ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Video jobs</span>
              <span className="font-mono text-xs text-zinc-200">
                {stats?.today.videoJobs ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Performance — real DB data */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Ingestion job success (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Success rate</span>
              <span className="font-mono text-xs text-zinc-200">
                {stats?.last30.successRate !== null && stats?.last30.successRate !== undefined
                  ? `${stats.last30.successRate}%`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Jobs run</span>
              <span className="font-mono text-xs text-zinc-200">
                {stats?.last30.jobs ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Succeeded</span>
              <span className="font-mono text-xs text-zinc-200">
                {stats?.last30.succeededJobs ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── job queue ── */}
      <Card className="border border-white/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Job Queue</CardTitle>
              <CardDescription className="mt-1 text-sm text-zinc-400">
                Recent automation jobs and their status
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="h-8 w-8 p-1"
                aria-label="Refresh jobs"
                onClick={() => void loadJobs()}
              >
                <Zap className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 gap-1 px-3 text-xs">
                    <Bot className="h-3.5 w-3.5" />
                    {filterLabel[jobFilter]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40">
                  {(["all", "running", "completed", "failed"] as JobFilter[]).map((f) => (
                    <DropdownMenuItem
                      key={f}
                      onClick={() => setJobFilter(f)}
                      className={jobFilter === f ? "bg-white/5" : ""}
                    >
                      {filterLabel[f]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredJobs.length === 0 ? (
            <div className="py-8 text-center text-zinc-400">
              <Bot className="mx-auto mb-4 h-8 w-8" />
              <p>No jobs{jobFilter !== "all" ? ` matching "${filterLabel[jobFilter]}"` : " in queue"}</p>
            </div>
          ) : (
            <Table className="w-full">
              <TableHead>
                <TableRow>
                  <TableCell className="w-28">Job ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell className="w-24">Status</TableCell>
                  <TableCell className="w-24">Started</TableCell>
                  <TableCell className="w-16">Duration</TableCell>
                  <TableCell className="w-24 text-right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id} className="border-b border-white/5">
                    <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}…</TableCell>
                    <TableCell className="text-sm text-zinc-300">{job.type}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      {job.startedAt
                        ? new Date(job.startedAt).toLocaleTimeString()
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-400">
                      {jobDuration(job)}
                    </TableCell>
                    <TableCell className="text-right">
                      {cancellingJobId === job.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-zinc-400">Cancel?</span>
                          <Button
                            variant="danger"
                            className="h-7 px-2 text-xs"
                            onClick={() => void handleCancelJob(job.id)}
                            disabled={isCancelling}
                          >
                            {isCancelling ? "…" : "Yes"}
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => setCancellingJobId(null)}
                            disabled={isCancelling}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-1"
                            aria-label="View job details"
                            onClick={() =>
                              setSelectedJob(selectedJob?.id === job.id ? null : job)
                            }
                          >
                            <Search className="h-3 w-3" />
                          </Button>
                          {(job.status === "RUNNING" || job.status === "QUEUED") && (
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-1 text-red-400 hover:text-red-300"
                              aria-label="Cancel job"
                              onClick={() => setCancellingJobId(job.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* job detail panel */}
          {selectedJob && (
            <div className="mt-4 rounded-lg border border-white/10 bg-white/3 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Job detail
                </p>
                <Button
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setSelectedJob(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <p className="text-zinc-500">ID</p>
                  <p className="mt-0.5 font-mono text-zinc-200">{selectedJob.id}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Type</p>
                  <p className="mt-0.5 text-zinc-200">{selectedJob.type}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Status</p>
                  <p className="mt-0.5">{getStatusBadge(selectedJob.status)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Duration</p>
                  <p className="mt-0.5 font-mono text-zinc-200">{jobDuration(selectedJob)}</p>
                </div>
                {selectedJob.error && (
                  <div className="col-span-2">
                    <p className="text-zinc-500">Error</p>
                    <p className="mt-0.5 text-red-300">{selectedJob.error}</p>
                  </div>
                )}
                {selectedJob.result !== undefined && (
                  <div className="col-span-2">
                    <p className="text-zinc-500">Result</p>
                    <pre className="mt-0.5 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded bg-black/30 p-2 text-zinc-300">
                      {JSON.stringify(selectedJob.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── source management ── */}
      <Card className="border border-white/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Source Management</CardTitle>
          <CardDescription className="mt-1 text-sm text-zinc-400">
            Configure and manage news sources for automated scraping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* add source form */}
          <form onSubmit={(e) => void handleAddSource(e)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-200">
                  Source name
                </label>
                <input
                  type="text"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="e.g., TechCrunch, Reuters"
                  className="w-full rounded-lg border border-white/10 bg-white/3 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-200">
                  Source URL
                </label>
                <input
                  type="text"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="e.g., https://techcrunch.com/feed/"
                  className="w-full rounded-lg border border-white/10 bg-white/3 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-200">Source type</label>
              <select
                value={newSourceType}
                onChange={(e) => setNewSourceType(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/10"
              >
                <option value="rss">RSS Feed</option>
                <option value="website">Website Scraping</option>
                <option value="api">API Endpoint</option>
              </select>
            </div>
            <Button type="submit" variant="primary" className="w-full px-4 py-3">
              Add Source
            </Button>
          </form>

          {/* sources list */}
          {sources.length === 0 ? (
            <div className="py-6 text-center text-zinc-400">
              <LayoutGrid className="mx-auto mb-4 h-8 w-8" />
              <p>No sources configured. Add your first source above.</p>
            </div>
          ) : (
            <Table className="w-full">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell className="w-16">Type</TableCell>
                  <TableCell className="w-20">Status</TableCell>
                  <TableCell className="w-28">Last scraped</TableCell>
                  <TableCell className="w-16">Articles</TableCell>
                  <TableCell className="w-28 text-right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sources.map((source) => (
                  <TableRow
                    key={source.id}
                    className="border-b border-white/5 hover:bg-white/3"
                  >
                    <TableCell className="text-sm font-medium">{source.name}</TableCell>
                    <TableCell className="max-w-45 truncate text-xs text-zinc-400">
                      {source.url}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-300">{source.type}</TableCell>
                    <TableCell>
                      <Badge tone={source.active ? "green" : "red"}>
                        {source.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      {source.lastScraped
                        ? new Date(source.lastScraped).toLocaleString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-400">
                      {source.articles?.length ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {deletingSourceId === source.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-zinc-400">Delete?</span>
                          <Button
                            variant="danger"
                            className="h-7 px-2 text-xs"
                            onClick={() => void handleDeleteSource(source.id)}
                            disabled={isDeletingSource}
                          >
                            {isDeletingSource ? "…" : "Yes"}
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => setDeletingSourceId(null)}
                            disabled={isDeletingSource}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-1"
                            aria-label={`Edit ${source.name}`}
                            onClick={() => openEditSource(source)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-1 text-red-400 hover:text-red-300"
                            aria-label={`Delete ${source.name}`}
                            onClick={() => setDeletingSourceId(source.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── edit source modal ── */}
      {editingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <p className="text-sm font-medium text-zinc-300">Edit source</p>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => setEditingSource(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4 p-5">
              <label className="block text-sm font-medium text-zinc-300">
                Name
                <input
                  type="text"
                  value={editSourceName}
                  onChange={(e) => setEditSourceName(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </label>
              <div className="rounded-lg border border-white/10 bg-white/3 p-3 text-xs">
                <p className="text-zinc-500">URL (read-only)</p>
                <p className="mt-1 break-all text-zinc-400">{editingSource.url}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/10 p-5">
              <Button variant="secondary" onClick={() => setEditingSource(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditSourceSave}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
