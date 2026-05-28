import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/authz";
import { createMission } from "@/lib/contributor/missions";
import { MissionType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const missions = await prisma.mission.findMany({
    include: { _count: { select: { participants: true, contributions: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ missions });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { title, description, type, targetCount, endsAt, region, topic, rewardPoints } = body;

  if (!title || !description || !type || !targetCount || !endsAt) {
    return NextResponse.json({ error: "title, description, type, targetCount, endsAt required" }, { status: 400 });
  }

  if (!(type as string in MissionType)) {
    return NextResponse.json({ error: "Invalid mission type" }, { status: 400 });
  }

  const mission = await createMission({
    title: title as string,
    description: description as string,
    type: type as MissionType,
    targetCount: Number(targetCount),
    endsAt: new Date(endsAt as string),
    region: region as string | undefined,
    topic: topic as string | undefined,
    rewardPoints: rewardPoints ? Number(rewardPoints) : undefined,
    createdBy: auth.session.user?.id,
  });

  return NextResponse.json({ mission }, { status: 201 });
}
