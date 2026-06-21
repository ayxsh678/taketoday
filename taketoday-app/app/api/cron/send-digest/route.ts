import { NextRequest, NextResponse } from "next/server";
import { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { appConfig } from "@/lib/config/app";
import { sendArticleBroadcast } from "@/lib/integrations/buttondown";

// Triggered by Vercel Cron every Monday 8 AM UTC.
// Compiles last 7 days of published articles into a digest draft in Buttondown.
// Status = "draft" — you review and send from Buttondown dashboard.

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  } else if (!appConfig.isDevelopment) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 503 });
  }

  const d7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const articles = await prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      publishedAt: { gte: d7 },
    },
    orderBy: { views: "desc" },
    take: 10,
    select: {
      headline: true,
      slug: true,
      excerpt: true,
      category: { select: { name: true } },
      views: true,
    },
  });

  if (articles.length === 0) {
    return NextResponse.json({ ok: true, skipped: "no articles this week" });
  }

  if (!appConfig.buttondownApiKey) {
    return NextResponse.json({ ok: false, error: "BUTTONDOWN_API_KEY not set" }, { status: 503 });
  }

  const siteUrl = appConfig.siteUrl;
  const now = new Date();
  const weekOf = formatDate(d7);

  const rows = articles.map((a) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #27272a;">
        <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#71717a;">
          ${a.category?.name ?? "News"}
        </p>
        <a href="${siteUrl}/article/${a.slug}"
           style="font-size:16px;font-weight:600;color:#fff;text-decoration:none;line-height:1.3;">
          ${a.headline}
        </a>
        ${a.excerpt ? `<p style="margin:6px 0 0;font-size:13px;color:#a1a1aa;line-height:1.5;">${a.excerpt}</p>` : ""}
        <a href="${siteUrl}/article/${a.slug}"
           style="display:inline-block;margin-top:8px;font-size:12px;color:#3b82f6;">
          Read →
        </a>
      </td>
    </tr>
  `).join("");

  const body = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#09090b;color:#fff;padding:32px 24px;border-radius:12px;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#52525b;">
        Week of ${weekOf}
      </p>
      <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#fff;">
        TakeToday Weekly
      </h1>
      <table style="width:100%;border-collapse:collapse;">
        ${rows}
      </table>
      <p style="margin:32px 0 0;font-size:12px;color:#52525b;text-align:center;">
        <a href="${siteUrl}" style="color:#52525b;">${siteUrl}</a>
      </p>
    </div>
  `;

  const result = await sendArticleBroadcast({
    subject: `TakeToday Weekly — ${formatDate(now)}`,
    body,
    preview: `${articles.length} stories from the past week`,
  });

  return NextResponse.json({ ok: result.ok, emailId: result.emailId, error: result.error, articleCount: articles.length });
}
