import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/firebase/admin";

// Firestore path: bookmarks/{userId}/articles/{slug}

function userBookmarksRef(userId: string) {
  return db.collection("bookmarks").doc(userId).collection("articles");
}

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
  const ref = userBookmarksRef(session.user.id);

  if (slug) {
    const doc = await ref.doc(slug).get();
    return NextResponse.json({ bookmarked: doc.exists });
  }

  const snapshot = await ref.orderBy("savedAt", "desc").get();
  const slugs = snapshot.docs.map((d) => d.id);
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

  const docRef = userBookmarksRef(session.user.id).doc(slug);
  const existing = await docRef.get();

  if (existing.exists) {
    await docRef.delete();
    return NextResponse.json({ bookmarked: false });
  }

  await docRef.set({ savedAt: new Date().toISOString() });
  return NextResponse.json({ bookmarked: true });
}
