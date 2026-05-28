import { NextRequest, NextResponse } from "next/server";
import { requireContributor } from "@/lib/contributor/authz";
import { getActivityFeed } from "@/lib/contributor/activity-feed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.nextUrl.searchParams.get("userId");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "20"), 50);
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;

  if (userId) {
    // Public profile feed
    const feed = await getActivityFeed({ userId, limit, cursor, publicOnly: true });
    return NextResponse.json({ feed });
  }

  const auth = await requireContributor();
  if (!auth.ok) return auth.response;

  const feed = await getActivityFeed({ userId: auth.session.id, limit, cursor, publicOnly: false });
  return NextResponse.json({ feed });
}
