import { NextRequest, NextResponse } from "next/server";
import { requireContributor } from "@/lib/contributor/authz";
import { getUserStreaks, applyStreakFreeze } from "@/lib/contributor/streaks";
import { StreakType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const auth = await requireContributor();
  if (!auth.ok) return auth.response;

  const streaks = await getUserStreaks(auth.session.id);
  return NextResponse.json({ streaks });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireContributor();
  if (!auth.ok) return auth.response;

  let body: { activityType?: string };
  try { body = await req.json() as { activityType?: string }; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.activityType || !(body.activityType in StreakType)) {
    return NextResponse.json({ error: "Invalid activityType" }, { status: 400 });
  }

  const result = await applyStreakFreeze(auth.session.id, body.activityType as StreakType);
  return NextResponse.json(result);
}
