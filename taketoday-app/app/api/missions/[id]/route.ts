import { NextRequest, NextResponse } from "next/server";
import { getMissionWithProgress } from "@/lib/contributor/missions";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const mission = await getMissionWithProgress(id);
  if (!mission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ mission });
}
