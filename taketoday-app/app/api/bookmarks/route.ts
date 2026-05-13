// force-dynamic prevents build-time execution which would trigger
// firebase-admin initialization before env vars are available.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { userBookmarksRef, bookmarkDocRef, getUserBookmarkSlugs } from "@/lib/firebase/bookmarks";

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
    const doc = await bookmarkDocRef(session.user.id, slug).get();
    return NextResponse.json({ bookmarked: doc.exists });
  }

  const slugs = await getUserBookmarkSlugs(session.user.id);
  return NextResponse.json({ slugs });
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

  const docRef = bookmarkDocRef(session.user.id, slug);
  const existing = await docRef.get();

  if (existing.exists) {
    await docRef.delete();
    return NextResponse.json({ bookmarked: false });
  }

  await docRef.set({ savedAt: new Date().toISOString() });
  return NextResponse.json({ bookmarked: true });
}
