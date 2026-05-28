import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { transitionWorkflow } from "@/lib/contributor/workflow";
import { recalculateReputation } from "@/lib/contributor/reputation";
import { recordStreakActivity } from "@/lib/contributor/streaks";
import { addReputationEvent } from "@/lib/contributor/reputation-graph";
import { checkAndAwardBadges } from "@/lib/contributor/badges";
import { logActivity } from "@/lib/contributor/activity-feed";
import { prisma as _prisma } from "@/lib/db/prisma";

const decisionSchema = z.object({
  decisionType: z.enum([
    "APPROVE",
    "REJECT",
    "REQUEST_CHANGES",
    "ESCALATE",
    "SEND_TO_FACT_CHECK",
    "DISPUTE",
    "PUBLISH",
    "ARCHIVE",
  ]),
  reason: z.string().min(10).max(1000),
  notes: z.string().max(2000).optional(),
  publiclyVisible: z.boolean().default(false),
  targetStage: z.string().optional(),
});

const stageMap: Record<string, string> = {
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  REQUEST_CHANGES: "SUBMITTED",
  ESCALATE: "EDITOR_REVIEW",
  SEND_TO_FACT_CHECK: "FACT_CHECK_PENDING",
  DISPUTE: "DISPUTED",
  PUBLISH: "PUBLISHED",
  ARCHIVE: "ARCHIVED",
};

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireAdmin("content:publish");
  if (!access.ok) return access.response;

  const contribution = await prisma.contribution.findUnique({
    where: { id },
    select: { id: true, authorId: true, workflowStage: true, riskScore: true, title: true, tags: true },
  });
  if (!contribution) return jsonError("Not found", 404);

  const body: unknown = await req.json().catch(() => null);
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const { decisionType, reason, notes, publiclyVisible } = parsed.data;
  const editorId = access.session.user.id!;

  const targetStage =
    parsed.data.targetStage ?? stageMap[decisionType] ?? contribution.workflowStage;

  // Log the editorial decision
  const decision = await prisma.editorialDecision.create({
    data: {
      contributionId: id,
      decisionType,
      reason,
      notes,
      editorId,
      publiclyVisible,
    },
  });

  // Transition workflow
  const transition = await transitionWorkflow({
    contributionId: id,
    from: contribution.workflowStage,
    to: targetStage as import("@prisma/client").WorkflowStage,
    actorId: editorId,
    actorType: "AdminUser",
    reason: `Editorial decision: ${decisionType} — ${reason}`,
  });

  if (!transition.ok) {
    // Delete the decision if workflow transition fails
    await prisma.editorialDecision.delete({ where: { id: decision.id } });
    return jsonError(transition.error, 409);
  }

  // Recalculate author reputation on publish or reject
  if (decisionType === "PUBLISH" || decisionType === "REJECT") {
    void recalculateReputation(contribution.authorId).catch(() => {});
  }

  // Phase D: fire streak + multidim reputation + badges + activity on publish
  if (decisionType === "PUBLISH") {
    const authorId = contribution.authorId;
    void (async () => {
      try {
        const aiScore = contribution.riskScore ?? 50;
        const qualityScore = 1 - (aiScore / 100);
        await recordStreakActivity(authorId, "DAILY_CONTRIBUTION", qualityScore);
        await recordStreakActivity(authorId, "WEEKLY_PUBLISHING", qualityScore);
        await addReputationEvent(authorId, "REPORTING", 25, "Contribution published", contribution.id, "contribution");
        await addReputationEvent(authorId, "ACCURACY", 10, "Contribution passed editorial review", contribution.id, "contribution");
        // Create civic impact record
        await _prisma.civicImpact.upsert({
          where: { contributionId: contribution.id },
          create: { contributionId: contribution.id, userId: authorId },
          update: {},
        });
        await logActivity(authorId, "CONTRIBUTION_PUBLISHED", contribution.id, { title: contribution.title });
        await checkAndAwardBadges(authorId);
        // Update expertise domains for contribution tags
        for (const tag of (contribution.tags ?? []).slice(0, 5)) {
          await _prisma.expertiseDomain.upsert({
            where: { userId_topic: { userId: authorId, topic: tag.toLowerCase() } },
            create: { userId: authorId, topic: tag.toLowerCase(), score: 1, contributions: 1 },
            update: { score: { increment: 1 }, contributions: { increment: 1 } },
          });
        }
      } catch (e) {
        console.error("[phase-d] publish events failed:", e);
      }
    })();
  }

  return jsonOk({ decision });
}
