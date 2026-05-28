import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard, refreshLeaderboard } from "@/lib/contributor/leaderboard";
import { LeaderboardType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const typeParam = req.nextUrl.searchParams.get("type") ?? "OVERALL";
  const scope = req.nextUrl.searchParams.get("scope") ?? "global";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "50"), 100);

  if (!(typeParam in LeaderboardType)) {
    return NextResponse.json({ error: "Invalid leaderboard type" }, { status: 400 });
  }

  const boardType = typeParam as LeaderboardType;

  // Refresh if stale (simple strategy: always refresh on GET, cache by period)
  await refreshLeaderboard(boardType, scope);

  const entries = await getLeaderboard(boardType, { scope, limit });
  return NextResponse.json({ entries, boardType, scope });
}
