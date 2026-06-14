import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { logAuditAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/prisma";
import { verifyArticle } from "@/lib/ai/verify-article";
import { NextRequest } from "next/server";
import { ArticleStatus, Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const verification = await prisma.articleVerification.findUnique({
      where: { articleId: id },
    });
    if (!verification) return jsonOk({ verification: null });
    return jsonOk({ verification });
  } catch (error) {
    return captureApiError(error);
  }
}

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const access = await requireAdmin("ai:run");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true, headline: true, body: true, status: true },
    });
    if (!article) return jsonError("Article not found", 404);
    if (!article.body || article.body.trim().length < 50) {
      return jsonError("Article body too short to verify", 422);
    }

    const result = await verifyArticle(article.headline, article.body);

    const claimsJson = result.claims as unknown as Prisma.InputJsonValue;

    const verification = await prisma.articleVerification.upsert({
      where: { articleId: id },
      create: {
        articleId: id,
        aiBrief: result.brief,
        aiClaims: claimsJson,
        aiScore: result.score,
        aiGeneratedAt: new Date(),
        aiModel: "gpt-4o-mini",
      },
      update: {
        aiBrief: result.brief,
        aiClaims: claimsJson,
        aiScore: result.score,
        aiGeneratedAt: new Date(),
        aiModel: "gpt-4o-mini",
        // Reset any previous editorial decision when re-running AI
        decision: null,
        reviewerId: null,
        reviewerNotes: null,
        checklist: Prisma.DbNull,
        decidedAt: null,
      },
    });

    // Advance status to FACT_CHECKING if still in DRAFT
    if (article.status === ArticleStatus.DRAFT) {
      await prisma.article.update({
        where: { id },
        data: { status: ArticleStatus.FACT_CHECKING },
      });
    }

    await logAuditAction({
      action: "verify_article",
      entity: "article",
      entityId: id,
      after: { score: result.score, claimCount: result.claims.length },
    });

    return jsonOk({ verification });
  } catch (error) {
    return captureApiError(error);
  }
}
