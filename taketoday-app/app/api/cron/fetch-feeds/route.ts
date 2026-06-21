import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { appConfig } from "@/lib/config/app";
import { RSS_FEEDS } from "@/lib/config/feeds";

// Triggered by Vercel Cron hourly. Fetches RSS feeds and upserts new items.

function extractCdata(s: string): string {
  return s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function getTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? extractCdata(m[1].trim()) : "";
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim().slice(0, 400);
}

interface ParsedItem {
  title: string;
  link: string;
  excerpt: string;
  publishedAt: Date | null;
}

function parseFeed(xml: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const isRss = /<rss|<channel>/.test(xml);

  if (isRss) {
    for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
      const raw = m[1];
      const title = stripHtml(getTag(raw, "title"));
      const link  = getTag(raw, "link") || getTag(raw, "guid");
      const excerpt = stripHtml(getTag(raw, "description") || getTag(raw, "summary"));
      const pubRaw  = getTag(raw, "pubDate") || getTag(raw, "published");
      if (title && link) {
        items.push({ title, link, excerpt, publishedAt: pubRaw ? new Date(pubRaw) : null });
      }
    }
  } else {
    // Atom
    for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)) {
      const raw = m[1];
      const title = stripHtml(getTag(raw, "title"));
      const link  = raw.match(/<link[^>]+href="([^"]+)"/)?.[1] ?? getTag(raw, "id");
      const excerpt = stripHtml(getTag(raw, "summary") || getTag(raw, "content"));
      const pubRaw  = getTag(raw, "published") || getTag(raw, "updated");
      if (title && link) {
        items.push({ title, link, excerpt, publishedAt: pubRaw ? new Date(pubRaw) : null });
      }
    }
  }

  return items.slice(0, 20);
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

  let totalNew = 0;
  const errors: string[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "TakeToday-RSS/1.0" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) { errors.push(`${feed.name}: HTTP ${res.status}`); continue; }

      const xml = await res.text();
      const items = parseFeed(xml);

      for (const item of items) {
        try {
          await prisma.$executeRaw`
            INSERT INTO "FeedItem" (id, feed_url, feed_name, title, link, excerpt, published_at, created_at)
            VALUES (gen_random_uuid()::text, ${feed.url}, ${feed.name}, ${item.title}, ${item.link},
                    ${item.excerpt || null}, ${item.publishedAt}, now())
            ON CONFLICT (link) DO NOTHING
          `;
          totalNew++;
        } catch { /* duplicate or bad row — skip */ }
      }
    } catch (err) {
      errors.push(`${feed.name}: ${err instanceof Error ? err.message : "fetch failed"}`);
    }
  }

  return NextResponse.json({ ok: true, totalNew, errors });
}
