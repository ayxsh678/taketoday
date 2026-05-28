import { NextRequest, NextResponse } from "next/server";
import { requireContributor } from "@/lib/contributor/authz";
import { joinMission } from "@/lib/contributor/missions";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const auth = await requireContributor();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await joinMission(auth.session.id, id);

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
