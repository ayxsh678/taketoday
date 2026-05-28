import { NextRequest, NextResponse } from "next/server";
import { getActiveMissions } from "@/lib/contributor/missions";
import { MissionType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const region = req.nextUrl.searchParams.get("region") ?? undefined;
  const topic = req.nextUrl.searchParams.get("topic") ?? undefined;
  const typeParam = req.nextUrl.searchParams.get("type");
  const type = typeParam && typeParam in MissionType ? (typeParam as MissionType) : undefined;

  const missions = await getActiveMissions({ region, topic, type });
  return NextResponse.json({ missions });
}
