"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, TrendingUp, FileText, Zap } from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

interface MetricPoint {
  label: string;
  value: number;
}

interface TopStory {
  slug: string;
  headline: string;
  views: number;
  priorityScore: number;
  publishedAt: string | null;
}

interface SourcePerf {
  source: string;
  type: string;
  totalJobs: number;
  successRate: number;
}

interface PipelineStage {
  status: string;
  count: number;
}

interface AnalyticsMeta {
  totalArticles: number;
  totalEvents: number;
  totalJobsLast30: number;
  succeededJobsLast30: number;
  overallSuccessRate: number | null;
}

interface AnalyticsData {
  traffic: MetricPoint[];
  engagement: MetricPoint[];
  topStories: TopStory[];
  sourcePerformance: SourcePerf[];
  pipeline: PipelineStage[];
  meta: AnalyticsMeta;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function BarChart({ series }: { series: MetricPoint[] }) {
  const max = Math.max(...series.map((p) => p.value), 1);
  return (
    <div className="flex h-28 items-end gap-1.5">
      {series.map((p) => (
        <div key={p.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-white/20 transition-all"
            style={{ height: `${Math.max((p.value / max) * 100, 2)}%` }}
          />
          <span className="text-[10px] text-zinc-500">{p.label}</span>
        </div>
      ))}
    </div>
  );
}

const pipelineTone: Record<string, "neutral" | "amber" | "blue" | "violet" | "green" | "red"> = {
  draft: "neutral",
  "under review": "amber",
  approved: "blue",
  scheduled: "violet",
  published: "green",
  archived: "red",
};

// ─── component ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { ok: boolean; data: AnalyticsData };
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      {/* ── header ── */}
      <div>
        <Badge tone="violet">Analytics</Badge>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white lg:text-4xl">
          Content Analytics
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">
          Real-time article pipeline, traffic, engagement, and ingestion performance.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="h-24 animate-pulse bg-white/4 rounded-lg" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : data ? (
        <>
          {/* ── summary metric cards ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total articles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{data.meta.totalArticles}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Published
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {data.pipeline.find((p) => p.status === "published")?.count ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  Analytics events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {data.meta.totalEvents.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Ingestion success (30d)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {data.meta.overallSuccessRate !== null
                    ? `${data.meta.overallSuccessRate}%`
                    : "—"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {data.meta.succeededJobsLast30}/{data.meta.totalJobsLast30} jobs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── traffic + engagement ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Traffic (last 7 days)</CardTitle>
                <CardDescription>Pageview events per day</CardDescription>
              </CardHeader>
              <CardContent>
                {data.traffic.every((p) => p.value === 0) ? (
                  <p className="py-8 text-center text-sm text-zinc-500">
                    No pageview events recorded yet.
                  </p>
                ) : (
                  <BarChart series={data.traffic} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement signals</CardTitle>
                <CardDescription>Avg CTR & scroll · total shares & saves</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.engagement.map((e) => (
                    <div key={e.label} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">{e.label}</span>
                      <span className="font-mono font-semibold text-white">
                        {e.label === "CTR"
                          ? `${e.value}%`
                          : e.label === "Scroll"
                            ? `${e.value}%`
                            : e.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {data.engagement.every((e) => e.value === 0) && (
                    <p className="pt-2 text-center text-xs text-zinc-600">
                      No engagement events recorded yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── article pipeline ── */}
          <Card>
            <CardHeader>
              <CardTitle>Article pipeline</CardTitle>
              <CardDescription>Count by workflow status</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const total = Math.max(
                  data.pipeline.reduce((s, p) => s + p.count, 0),
                  1,
                );
                return (
                  <div className="space-y-3">
                    {data.pipeline.map((stage) => (
                      <div key={stage.status} className="flex items-center gap-3">
                        <Badge
                          tone={pipelineTone[stage.status] ?? "neutral"}
                          className="w-28 justify-center text-xs capitalize"
                        >
                          {stage.status}
                        </Badge>
                        <div className="flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full bg-white/40 transition-all"
                            style={{
                              width: `${Math.max((stage.count / total) * 100, stage.count > 0 ? 1 : 0)}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-sm font-mono text-zinc-300">
                          {stage.count}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* ── top stories + source performance ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top published stories</CardTitle>
                <CardDescription>By priority score · analytics event count</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topStories.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-500">
                    No published articles found.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {data.topStories.map((story, i) => (
                      <div
                        key={story.slug}
                        className="flex items-start gap-3 rounded-md px-2 py-2.5 hover:bg-white/3"
                      >
                        <span className="mt-0.5 min-w-5 text-xs font-mono text-zinc-600">
                          {i + 1}.
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-white">{story.headline}</p>
                          <p className="mt-0.5 font-mono text-xs text-zinc-500">{story.slug}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                          <span className="text-xs font-semibold text-zinc-300">
                            {story.views.toLocaleString()} ev.
                          </span>
                          <span className="text-xs text-zinc-600">
                            p{story.priorityScore}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Source performance</CardTitle>
                <CardDescription>Ingestion job success rate per active source</CardDescription>
              </CardHeader>
              <CardContent>
                {data.sourcePerformance.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-500">
                    No active ingestion sources configured.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.sourcePerformance.map((src) => (
                      <div key={src.source} className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-zinc-200">{src.source}</p>
                          <p className="text-xs text-zinc-500">{src.type} · {src.totalJobs} jobs</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                src.successRate >= 80
                                  ? "bg-green-500"
                                  : src.successRate >= 50
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${src.successRate}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs font-mono text-zinc-300">
                            {src.totalJobs === 0 ? "—" : `${src.successRate}%`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
