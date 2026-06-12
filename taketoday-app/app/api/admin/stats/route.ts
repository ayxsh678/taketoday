import { captureApiError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { ArticleStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

function computeDelta(current: number, prev: number): string {
  if (prev === 0 && current === 0) return "0%";
  if (prev === 0) return current > 0 ? "+100%" : "0%";
  const pct = ((current - prev) / prev) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export async function GET(_request: NextRequest) {
  const access = await requireAdmin("dashboard:read");
  if (!access.ok) return access.response;

  try {
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      publishedTotal, publishedLast30, publishedPrev30,
      draftsTotal, draftsLast30, draftsPrev30,
      scheduledTotal, scheduledLast30, scheduledPrev30,
      archivedTotal,
      totalViews,
    ] = await Promise.all([
      prisma.article.count({ where: { status: ArticleStatus.PUBLISHED } }),
      prisma.article.count({ where: { status: ArticleStatus.PUBLISHED, publishedAt: { gte: d30 } } }),
      prisma.article.count({ where: { status: ArticleStatus.PUBLISHED, publishedAt: { gte: d60, lt: d30 } } }),

      prisma.article.count({ where: { status: ArticleStatus.DRAFT } }),
      prisma.article.count({ where: { status: ArticleStatus.DRAFT, createdAt: { gte: d30 } } }),
      prisma.article.count({ where: { status: ArticleStatus.DRAFT, createdAt: { gte: d60, lt: d30 } } }),

      prisma.article.count({ where: { status: ArticleStatus.SCHEDULED } }),
      prisma.article.count({ where: { status: ArticleStatus.SCHEDULED, createdAt: { gte: d30 } } }),
      prisma.article.count({ where: { status: ArticleStatus.SCHEDULED, createdAt: { gte: d60, lt: d30 } } }),

      prisma.article.count({ where: { status: ArticleStatus.ARCHIVED } }),

      prisma.article.aggregate({ _sum: { views: true } }),
    ]);

    return jsonOk({
      stats: {
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
        archived: {
          value: archivedTotal,
          delta: "—",
        },
        totalViews: {
          value: totalViews._sum.views ?? 0,
          delta: "—",
        },
      },
    });
  } catch (error) {
    return captureApiError(error);
  }
}
