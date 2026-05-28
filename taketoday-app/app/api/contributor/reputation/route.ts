import { NextRequest, NextResponse } from "next/server";
import { requireContributor } from "@/lib/contributor/authz";
import { getReputationDimensions, applyReputationDecay } from "@/lib/contributor/reputation-graph";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.nextUrl.searchParams.get("userId");

  const targetId = userId ?? null;

  // Public lookup
  if (targetId) {
    const repDim = await getReputationDimensions(targetId);
    const events = await prisma.reputationEvent.findMany({
      where: { userId: targetId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ reputation: repDim, recentEvents: events });
  }

  const auth = await requireContributor();
  if (!auth.ok) return auth.response;

  // Apply decay before returning
  await applyReputationDecay(auth.session.id);

  const [repDim, events, expertiseDomains] = await Promise.all([
    getReputationDimensions(auth.session.id),
    prisma.reputationEvent.findMany({
      where: { userId: auth.session.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.expertiseDomain.findMany({
      where: { userId: auth.session.id },
      orderBy: { score: "desc" },
    }),
  ]);

  return NextResponse.json({ reputation: repDim, recentEvents: events, expertiseDomains });
}
