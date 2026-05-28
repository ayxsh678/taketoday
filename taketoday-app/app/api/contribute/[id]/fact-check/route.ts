import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";
import { logTransparencyEvent } from "@/lib/contributor/workflow";
import { recordStreakActivity } from "@/lib/contributor/streaks";
import { addReputationEvent } from "@/lib/contributor/reputation-graph";
import { logActivity } from "@/lib/contributor/activity-feed";
import { checkAndAwardBadges } from "@/lib/contributor/badges";

const factCheckSchema = z.object({
  claim: z.string().min(10).max(500),
  verdict: z.enum([
    "TRUE",
    "MOSTLY_TRUE",
    "PARTIALLY_TRUE",
    "CONTEXT_NEEDED",
    "MOSTLY_FALSE",
    "FALSE",
    "UNVERIFIABLE",
    "SATIRE",
  ]),
  explanation: z.string().min(20).max(2000),
  evidenceLinks: z.array(z.string().url()).max(10).default([]),
  confidenceScore: z.number().min(0).max(100).optional(),
  aiAssisted: z.boolean().default(false),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("factcheck:submit");
  if (!access.ok) return access.response;

  const contribution = await prisma.contribution.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!contribution) return jsonError("Not found", 404);

  const body: unknown = await req.json().catch(() => null);
  const parsed = factCheckSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const factCheck = await prisma.factCheck.create({
    data: {
      contributionId: id,
      checkerId: access.session.id,
      ...parsed.data,
    },
  });

  await logTransparencyEvent(
    id,
    "FACT_CHECKED",
    access.session.id,
    "PublicUser",
    `Fact check submitted: ${parsed.data.verdict}`,
    { verdict: parsed.data.verdict, confidenceScore: parsed.data.confidenceScore },
  );

  // Phase D: streak + reputation + badges
  void (async () => {
    try {
      const checkerId = access.session.id;
      await recordStreakActivity(checkerId, "FACT_CHECKING", 0.8);
      const isDecisive = ["TRUE", "MOSTLY_TRUE", "FALSE", "MOSTLY_FALSE"].includes(parsed.data.verdict);
      await addReputationEvent(checkerId, "FACT_CHECK", isDecisive ? 15 : 8, `Fact check: ${parsed.data.verdict}`, id, "contribution");
      await logActivity(checkerId, "FACT_CHECK_COMPLETED", id, { verdict: parsed.data.verdict });
      await checkAndAwardBadges(checkerId);
    } catch (e) {
      console.error("[phase-d] fact-check events failed:", e);
    }
  })();

  return jsonOk({ factCheck }, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const factChecks = await prisma.factCheck.findMany({
    where: { contributionId: id },
    orderBy: { createdAt: "desc" },
    include: {
      checker: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isVerifiedJournalist: true,
          reputation: { select: { tier: true } },
        },
      },
    },
  });

  return jsonOk({ factChecks });
}
