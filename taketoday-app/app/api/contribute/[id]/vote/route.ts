import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";
import { logTransparencyEvent } from "@/lib/contributor/workflow";

const voteSchema = z.object({
  type: z.enum(["CREDIBLE", "NEEDS_VERIFICATION", "DISPUTED", "SPAM", "INSIGHTFUL"]),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("community:vote");
  if (!access.ok) return access.response;

  const contribution = await prisma.contribution.findUnique({
    where: { id },
    select: { id: true, authorId: true, workflowStage: true },
  });
  if (!contribution) return jsonError("Not found", 404);
  if (contribution.authorId === access.session.id) {
    return jsonError("Cannot vote on your own contribution", 409);
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  // Weight vote by reputation tier
  const tierWeights: Record<string, number> = {
    NEWCOMER: 0.5,
    CONTRIBUTOR: 1.0,
    TRUSTED: 1.5,
    VERIFIED: 2.0,
    EXPERT: 3.0,
    STAFF: 5.0,
  };
  const weight = tierWeights[access.session.reputationTier] ?? 1.0;

  const vote = await prisma.communityVote.upsert({
    where: { contributionId_userId: { contributionId: id, userId: access.session.id } },
    create: {
      contributionId: id,
      userId: access.session.id,
      type: parsed.data.type,
      weight,
    },
    update: { type: parsed.data.type, weight },
  });

  await logTransparencyEvent(
    id,
    "COMMUNITY_VOTED",
    access.session.id,
    "PublicUser",
    `Community vote: ${parsed.data.type}`,
    { voteType: parsed.data.type, weight },
  );

  return jsonOk({ vote });
}
