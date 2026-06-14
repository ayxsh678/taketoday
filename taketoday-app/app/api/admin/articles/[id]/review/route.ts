import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { logAuditAction } from "@/lib/admin/audit";
import { getOrCreateAdminUser } from "@/lib/admin/current-user";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";
import { ArticleStatus, Prisma } from "@prisma/client";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const reviewSchema = z.object({
  decision: z.enum(["APPROVED", "NEEDS_REVISION"]),
  notes: z.string().max(2000).optional(),
  checklist: z
    .object({
      sourcesVerified: z.boolean(),
      claimsChecked: z.boolean(),
      legalCleared: z.boolean(),
    })
    .optional(),
});

export async function POST(req: NextRequest, { params }: RouteContext) {
  const access = await requireAdmin("content:publish");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  try {
    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!article) return jsonError("Article not found", 404);

    // Only articles in FACT_CHECKING or EDITORIAL_REVIEW can be reviewed
    const reviewableStatuses: ArticleStatus[] = [
      ArticleStatus.FACT_CHECKING,
      ArticleStatus.EDITORIAL_REVIEW,
    ];
    if (!reviewableStatuses.includes(article.status)) {
      return jsonError(
        `Cannot review article in status: ${article.status.toLowerCase()}`,
        422,
      );
    }

    const reviewer = await getOrCreateAdminUser(access.session);

    const checklistJson = parsed.data.checklist
      ? (parsed.data.checklist as unknown as Prisma.InputJsonValue)
      : Prisma.DbNull;

    const verification = await prisma.articleVerification.upsert({
      where: { articleId: id },
      create: {
        articleId: id,
        reviewerId: reviewer.id,
        reviewerNotes: parsed.data.notes ?? null,
        checklist: checklistJson,
        decision: parsed.data.decision,
        decidedAt: new Date(),
      },
      update: {
        reviewerId: reviewer.id,
        reviewerNotes: parsed.data.notes ?? null,
        checklist: checklistJson,
        decision: parsed.data.decision,
        decidedAt: new Date(),
      },
    });

    // Advance or revert article status based on decision
    const nextStatus =
      parsed.data.decision === "APPROVED"
        ? ArticleStatus.READY_TO_PUBLISH
        : ArticleStatus.DRAFT;

    await prisma.article.update({
      where: { id },
      data: { status: nextStatus },
    });

    await logAuditAction({
      action: "review_article",
      entity: "article",
      entityId: id,
      after: {
        decision: parsed.data.decision,
        reviewerId: reviewer.id,
        nextStatus,
      },
    });

    return jsonOk({ verification, nextStatus: nextStatus.toLowerCase() });
  } catch (error) {
    return captureApiError(error);
  }
}
