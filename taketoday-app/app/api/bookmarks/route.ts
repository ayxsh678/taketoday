import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * GET /api/bookmarks?slug=xxx  → { bookmarked: boolean }
 * GET /api/bookmarks           → { slugs: string[] }
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");

  if (slug) {
    const row = await db.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.userId, session.user.id),
        eq(bookmarks.slug, slug),
      ),
    });
    return NextResponse.json({ bookmarked: !!row });
  }

  const rows = await db.query.bookmarks.findMany({
    where: eq(bookmarks.userId, session.user.id),
    orderBy: (b, { desc }) => [desc(b.savedAt)],
  });
  return NextResponse.json({ slugs: rows.map((r) => r.slug) });
}

/**
 * POST /api/bookmarks
 * Body: { slug: string }
 * Toggles bookmark. Returns { bookmarked: boolean }.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { slug } = body as { slug?: unknown };
  if (!slug || typeof slug !== "string" || slug.trim() === "") {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const userId = session.user.id;

  const existing = await db.query.bookmarks.findFirst({
    where: and(eq(bookmarks.userId, userId), eq(bookmarks.slug, slug)),
  });

  if (existing) {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.slug, slug)));
    return NextResponse.json({ bookmarked: false });
  }

  await db.insert(bookmarks).values({ userId, slug });
  return NextResponse.json({ bookmarked: true });
}
