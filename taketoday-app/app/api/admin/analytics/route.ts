import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";
import { captureApiError, jsonOk } from "@/lib/admin/api";
import { ArticleStatus } from "@prisma/client";

export async function GET(_req: NextRequest) {
  const access = await requireAdmin("dashboard:read");
  if (!access.ok) return access.response;

  try {
    const d7  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
    const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [topArticles, byCountry, byReferrer, dailyViews] = await Promise.all([
      prisma.article.findMany({
        where: { status: ArticleStatus.PUBLISHED },
        orderBy: { views: "desc" },
        take: 5,
        select: { slug: true, headline: true, views: true },
      }),

      prisma.$queryRaw<{ country: string; count: bigint }[]>`
        SELECT coalesce(country, 'Direct') AS country, count(*) AS count
        FROM "PageView"
        WHERE at >= ${d30}
        GROUP BY country
        ORDER BY count DESC
        LIMIT 8
      `,

      prisma.$queryRaw<{ referrer: string; count: bigint }[]>`
        SELECT coalesce(referrer, 'Direct') AS referrer, count(*) AS count
        FROM "PageView"
        WHERE at >= ${d30}
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 8
      `,

      prisma.$queryRaw<{ day: string; count: bigint }[]>`
        SELECT
          to_char(date_trunc('day', at AT TIME ZONE 'UTC'), 'Mon DD') AS day,
          date_trunc('day', at AT TIME ZONE 'UTC') AS bucket,
          count(*) AS count
        FROM "PageView"
        WHERE at >= ${d7}
        GROUP BY bucket
        ORDER BY bucket
      `,
    ]);

    return jsonOk({
      topArticles: topArticles.map((a) => ({
        slug: a.slug,
        headline: a.headline,
        views: a.views,
      })),
      byCountry:  byCountry.map((r)  => ({ country:  r.country,  count: Number(r.count) })),
      byReferrer: byReferrer.map((r) => ({ referrer: r.referrer, count: Number(r.count) })),
      dailyViews: dailyViews.map((r) => ({ day: r.day,           count: Number(r.count) })),
    });
  } catch (error) {
    return captureApiError(error);
  }
}
