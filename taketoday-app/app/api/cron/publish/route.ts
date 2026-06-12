import { NextRequest, NextResponse } from "next/server";
import { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { appConfig } from "@/lib/config/app";
import { sendArticleBroadcast } from "@/lib/integrations/buttondown";

// Triggered by Vercel Cron (vercel.json) daily at 1 AM UTC in production.
// Publishes any SCHEDULED articles whose scheduledAt ≤ now.

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  } else if (!appConfig.isDevelopment) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  }

  const now = new Date();

  const due = await prisma.article.findMany({
    where: {
      status: ArticleStatus.SCHEDULED,
      scheduledAt: { lte: now },
    },
    select: { id: true, headline: true, slug: true, scheduledAt: true },
  });

  if (due.length === 0) {
    return NextResponse.json({ ok: true, published: 0, ts: now.toISOString() });
  }

  const ids = due.map((a) => a.id);

  const { count } = await prisma.article.updateMany({
    where: { id: { in: ids }, status: ArticleStatus.SCHEDULED },
    data: {
      status: ArticleStatus.PUBLISHED,
      publishedAt: now,
    },
  });

  if (appConfig.buttondownApiKey) {
    for (const article of due) {
      void sendArticleBroadcast({
        subject: article.headline,
        body: `<p>A new article has been published on TakeToday: <strong>${article.headline}</strong></p><p><a href="${appConfig.siteUrl}/article/${article.slug}">Read now →</a></p>`,
        preview: article.headline,
      }).catch(() => {
        /* non-fatal */
      });
    }
  }

  process.stdout.write(
    JSON.stringify({
      ts: now.toISOString(),
      level: "info",
      service: "cron",
      job: "publish",
      count,
      articleIds: ids,
      message: `Published ${count} scheduled article(s)`,
    }) + "\n",
  );

  return NextResponse.json({
    ok: true,
    published: count,
    articles: due.map((a) => ({ id: a.id, slug: a.slug, headline: a.headline })),
    ts: now.toISOString(),
  });
}
