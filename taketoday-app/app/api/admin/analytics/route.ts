import { jsonError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { ArticleStatus, JobStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

export async function GET(_request: NextRequest) {
  const access = await requireAdmin("analytics:read");
  if (!access.ok) return access.response;

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      articlesByStatus,
      recentPageviews,
      ctrAgg,
      scrollAgg,
      shareSum,
      saveSum,
      topArticles,
      activeSources,
      totalJobsLast30,
      succeededJobsLast30,
      totalArticles,
      totalEvents,
    ] = await Promise.all([
      // Article pipeline breakdown
      prisma.article.groupBy({ by: ["status"], _count: { id: true } }),

      // Pageview events last 7 days (for traffic chart)
      prisma.analyticsEvent.findMany({
        where: { type: "pageview", createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, value: true },
        orderBy: { createdAt: "asc" },
      }),

      // Avg CTR across all events
      prisma.analyticsEvent.aggregate({ where: { type: "ctr" }, _avg: { value: true } }),

      // Avg scroll depth
      prisma.analyticsEvent.aggregate({
        where: { type: "scroll_depth" },
        _avg: { value: true },
      }),

      // Total shares
      prisma.analyticsEvent.aggregate({ where: { type: "share" }, _sum: { value: true } }),

      // Total saves
      prisma.analyticsEvent.aggregate({ where: { type: "save" }, _sum: { value: true } }),

      // Top 5 published articles by priority score (proxy for performance)
      prisma.article.findMany({
        where: { status: ArticleStatus.PUBLISHED },
        select: {
          slug: true,
          headline: true,
          priorityScore: true,
          publishedAt: true,
          _count: { select: { analyticsEvents: true } },
        },
        orderBy: { priorityScore: "desc" },
        take: 5,
      }),

      // Active ingestion sources + recent job statuses
      prisma.ingestionSource.findMany({
        where: { active: true },
        select: {
          name: true,
          type: true,
          jobs: {
            select: { status: true },
            orderBy: { createdAt: "desc" },
            take: 100,
          },
        },
        take: 8,
      }),

      // Total ingestion jobs last 30 days
      prisma.ingestionJob.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

      // Succeeded ingestion jobs last 30 days
      prisma.ingestionJob.count({
        where: { status: JobStatus.SUCCEEDED, createdAt: { gte: thirtyDaysAgo } },
      }),

      // Total articles across all statuses
      prisma.article.count(),

      // Total analytics events
      prisma.analyticsEvent.count(),
    ]);

    // ── traffic series (last 7 days) ─────────────────────────────────────────
    const trafficByDay: Record<string, number> = {};
    for (const event of recentPageviews) {
      const day = event.createdAt.toISOString().slice(0, 10);
      trafficByDay[day] = (trafficByDay[day] ?? 0) + event.value;
    }

    const traffic = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      return { label, value: Math.round(trafficByDay[key] ?? 0) };
    });

    // ── engagement breakdown ─────────────────────────────────────────────────
    const engagement = [
      { label: "CTR", value: Math.round((ctrAgg._avg.value ?? 0) * 10) / 10 },
      { label: "Scroll", value: Math.round(scrollAgg._avg.value ?? 0) },
      { label: "Shares", value: Math.round(shareSum._sum.value ?? 0) },
      { label: "Saves", value: Math.round(saveSum._sum.value ?? 0) },
    ];

    // ── top stories ──────────────────────────────────────────────────────────
    const topStories = topArticles.map((a) => ({
      slug: a.slug,
      headline: a.headline,
      views: a._count.analyticsEvents,
      priorityScore: a.priorityScore,
      publishedAt: a.publishedAt?.toISOString() ?? null,
    }));

    // ── source performance ───────────────────────────────────────────────────
    const sourcePerformance = activeSources.map((s) => ({
      source: s.name,
      type: s.type,
      totalJobs: s.jobs.length,
      successRate:
        s.jobs.length === 0
          ? 0
          : Math.round(
              (s.jobs.filter((j) => j.status === JobStatus.SUCCEEDED).length /
                s.jobs.length) *
                100,
            ),
    }));

    // ── article pipeline ─────────────────────────────────────────────────────
    const statusOrder = [
      ArticleStatus.DRAFT,
      ArticleStatus.UNDER_REVIEW,
      ArticleStatus.APPROVED,
      ArticleStatus.SCHEDULED,
      ArticleStatus.PUBLISHED,
      ArticleStatus.ARCHIVED,
    ] as const;
    const countByStatus = new Map(articlesByStatus.map((s) => [s.status, s._count.id]));
    const pipeline = statusOrder.map((status) => ({
      status: status.toLowerCase().replace("_", " "),
      count: countByStatus.get(status) ?? 0,
    }));

    // ── summary meta ─────────────────────────────────────────────────────────
    const overallSuccessRate =
      totalJobsLast30 === 0
        ? null
        : Math.round((succeededJobsLast30 / totalJobsLast30) * 100);

    return jsonOk({
      traffic,
      engagement,
      topStories,
      sourcePerformance,
      pipeline,
      meta: {
        totalArticles,
        totalEvents,
        totalJobsLast30,
        succeededJobsLast30,
        overallSuccessRate,
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to fetch analytics",
      500,
    );
  }
}
