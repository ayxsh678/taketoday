import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";
import { captureApiError, jsonOk } from "@/lib/admin/api";

// GET /api/admin/story-leads — list unread feed items
export async function GET(req: NextRequest) {
  const access = await requireAdmin("dashboard:read");
  if (!access.ok) return access.response;

  try {
    const url = new URL(req.url);
    const source = url.searchParams.get("source");
    const limit  = Math.min(Number(url.searchParams.get("limit") ?? 40), 100);

    const rows = await prisma.$queryRaw<{
      id: string;
      feed_name: string;
      title: string;
      link: string;
      excerpt: string | null;
      published_at: Date | null;
    }[]>`
      SELECT id, feed_name, title, link, excerpt, published_at
      FROM "FeedItem"
      WHERE dismissed = false AND used_at IS NULL
        ${source ? prisma.$queryRaw`AND feed_name = ${source}` : prisma.$queryRaw``}
      ORDER BY published_at DESC NULLS LAST
      LIMIT ${limit}
    `;

    const sources = await prisma.$queryRaw<{ feed_name: string; count: bigint }[]>`
      SELECT feed_name, count(*) AS count
      FROM "FeedItem"
      WHERE dismissed = false AND used_at IS NULL
      GROUP BY feed_name
      ORDER BY count DESC
    `;

    return jsonOk({
      items: rows.map((r) => ({
        id: r.id,
        source: r.feed_name,
        title: r.title,
        link: r.link,
        excerpt: r.excerpt ?? "",
        publishedAt: r.published_at?.toISOString() ?? null,
      })),
      sources: sources.map((s) => ({ name: s.feed_name, count: Number(s.count) })),
    });
  } catch (error) {
    return captureApiError(error);
  }
}

// PATCH /api/admin/story-leads — dismiss or mark used
export async function PATCH(req: NextRequest) {
  const access = await requireAdmin("dashboard:read");
  if (!access.ok) return access.response;

  try {
    const { id, action } = (await req.json()) as { id?: string; action?: "dismiss" | "use" };
    if (!id || !action) return new Response(JSON.stringify({ error: "id and action required" }), { status: 400 });

    if (action === "dismiss") {
      await prisma.$executeRaw`
        UPDATE "FeedItem" SET dismissed = true WHERE id = ${id}
      `;
    } else if (action === "use") {
      await prisma.$executeRaw`
        UPDATE "FeedItem" SET used_at = now() WHERE id = ${id}
      `;
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return captureApiError(error);
  }
}
