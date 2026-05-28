import { NextRequest, NextResponse } from "next/server";
import { requireContributor } from "@/lib/contributor/authz";
import { getUserBadges, checkAndAwardBadges, toggleBadgeShowcase, ensureBadgesSeedeed, BADGE_DEFINITIONS } from "@/lib/contributor/badges";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.nextUrl.searchParams.get("userId");

  // Public profile badges: no auth needed
  if (userId) {
    const badges = await getUserBadges(userId);
    return NextResponse.json({ badges });
  }

  const auth = await requireContributor();
  if (!auth.ok) return auth.response;

  const [badges, newBadges] = await Promise.all([
    getUserBadges(auth.session.id),
    checkAndAwardBadges(auth.session.id),
  ]);

  return NextResponse.json({ badges, newBadges, allDefinitions: BADGE_DEFINITIONS });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const auth = await requireContributor();
  if (!auth.ok) return auth.response;

  let body: { userBadgeId?: string; isShowcased?: boolean };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.userBadgeId || body.isShowcased === undefined) {
    return NextResponse.json({ error: "userBadgeId and isShowcased required" }, { status: 400 });
  }

  const updated = await toggleBadgeShowcase(auth.session.id, body.userBadgeId, body.isShowcased);
  return NextResponse.json({ badge: updated });
}

// Seed all badge definitions (admin/internal)
export async function PUT(): Promise<NextResponse> {
  await ensureBadgesSeedeed();
  return NextResponse.json({ ok: true });
}
