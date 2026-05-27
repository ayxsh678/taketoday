import { NextRequest } from "next/server";
import { ArticleStatus, JobStatus } from "@prisma/client";
import { captureApiError, jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

function computeDelta(current: number, prev: number): string {
  if (prev === 0 && current === 0) return "0%";
  if (prev === 0) return current > 0 ? "+100%" : "0%";
  const pct = ((current - prev) / prev) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export async function GET(request: NextRequest) {
  if (rateLimit(request)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("dashboard:read");
  if (!access.ok) return access.response;

  try {
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      publishedTotal,
      publishedLast30,
      publishedPrev30,
      draftsTotal,
      draftsLast30,
      draftsPrev30,
      scheduledTotal,
      scheduledLast30,
      scheduledPrev30,
      pendingTotal,
      pendingLast30,
      pendingPrev30,
      socialTotal,
      socialLast30,
      socialPrev30,
      videoJobsTotal,
      videoJobsLast30,
      videoJobsPrev30,
      ingestionSucceeded,
      ingestionLast30,
      ingestionPrev30,
      trafficAggregate,
      trafficPrevAggregate,
      ctrAggregate,
    ] = await Promise.all([
      // Published articles — total + period windows
      prisma.article.count({ where: { status: ArticleStatus.PUBLISHED } }),
      prisma.article.count({ where: { status: ArticleStatus.PUBLISHED, publishedAt: { gte: d30 } } }),
      prisma.article.count({ where: { status: ArticleStatus.PUBLISHED, publishedAt: { gte: d60, lt: d30 } } }),

      // Drafts — total + period windows
      prisma.article.count({ where: { status: ArticleStatus.DRAFT } }),
      prisma.article.count({ where: { status: ArticleStatus.DRAFT, createdAt: { gte: d30 } } }),
      prisma.article.count({ where: { status: ArticleStatus.DRAFT, createdAt: { gte: d60, lt: d30 } } }),

      // Scheduled — total + period windows
      prisma.article.count({ where: { status: ArticleStatus.SCHEDULED } }),
      prisma.article.count({ where: { status: ArticleStatus.SCHEDULED, createdAt: { gte: d30 } } }),
      prisma.article.count({ where: { status: ArticleStatus.SCHEDULED, createdAt: { gte: d60, lt: d30 } } }),

      // Pending review — total + period windows
      prisma.article.count({ where: { status: ArticleStatus.UNDER_REVIEW } }),
      prisma.article.count({ where: { status: ArticleStatus.UNDER_REVIEW, createdAt: { gte: d30 } } }),
      prisma.article.count({ where: { status: ArticleStatus.UNDER_REVIEW, createdAt: { gte: d60, lt: d30 } } }),

      // Social posts published — total + period windows
      prisma.socialPost.count({ where: { status: JobStatus.SUCCEEDED } }),
      prisma.socialPost.count({ where: { status: JobStatus.SUCCEEDED, publishedAt: { gte: d30 } } }),
      prisma.socialPost.count({ where: { status: JobStatus.SUCCEEDED, publishedAt: { gte: d60, lt: d30 } } }),

      // Short video jobs (AI asset proxy) — total + period windows
      prisma.shortVideoJob.count(),
      prisma.shortVideoJob.count({ where: { createdAt: { gte: d30 } } }),
      prisma.shortVideoJob.count({ where: { createdAt: { gte: d60, lt: d30 } } }),

      // Ingestion jobs succeeded — total + period windows
      prisma.ingestionJob.count({ where: { status: JobStatus.SUCCEEDED } }),
      prisma.ingestionJob.count({ where: { status: JobStatus.SUCCEEDED, createdAt: { gte: d30 } } }),
      prisma.ingestionJob.count({ where: { status: JobStatus.SUCCEEDED, createdAt: { gte: d60, lt: d30 } } }),

      // Analytics aggregates
      prisma.analyticsEvent.aggregate({
        where: { type: "pageview", createdAt: { gte: d30 } },
        _sum: { value: true },
      }),
      prisma.analyticsEvent.aggregate({
        where: { type: "pageview", createdAt: { gte: d60, lt: d30 } },
        _sum: { value: true },
      }),
      prisma.analyticsEvent.aggregate({
        where: { type: "ctr", createdAt: { gte: d30 } },
        _avg: { value: true },
      }),
    ]);

    const traffic = trafficAggregate._sum.value ?? 0;
    const trafficPrev = trafficPrevAggregate._sum.value ?? 0;
    const ctr = ctrAggregate._avg.value ?? 0;

    const aiTotal = videoJobsTotal + ingestionSucceeded;
    const aiLast30 = videoJobsLast30 + ingestionLast30;
    const aiPrev30 = videoJobsPrev30 + ingestionPrev30;

    const stats = {
      publishedNews: {
        value: publishedTotal,
        delta: computeDelta(publishedLast30, publishedPrev30),
      },
      drafts: {
        value: draftsTotal,
        delta: computeDelta(draftsLast30, draftsPrev30),
      },
      scheduledPosts: {
        value: scheduledTotal,
        delta: computeDelta(scheduledLast30, scheduledPrev30),
      },
      pendingApprovals: {
        value: pendingTotal,
        delta: computeDelta(pendingLast30, pendingPrev30),
      },
      socialPostsPublished: {
        value: socialTotal,
        delta: computeDelta(socialLast30, socialPrev30),
      },
      websiteTraffic: {
        value: Math.round(traffic),
        delta: computeDelta(Math.round(traffic), Math.round(trafficPrev)),
      },
      engagementCtr: {
        value: parseFloat(ctr.toFixed(2)),
        delta: "—",
      },
      aiGeneratedAssets: {
        value: aiTotal,
        delta: computeDelta(aiLast30, aiPrev30),
      },
    };

    return jsonOk({ stats });
  } catch (error) {
    return captureApiError(error);
  }
}
