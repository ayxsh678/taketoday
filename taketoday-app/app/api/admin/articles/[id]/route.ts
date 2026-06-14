import { articlePatchSchema, captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { ArticleStatus, Prisma } from "@prisma/client";
import { logAuditAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const statusMap: Record<string, ArticleStatus> = {
  draft: ArticleStatus.DRAFT,
  fact_checking: ArticleStatus.FACT_CHECKING,
  editorial_review: ArticleStatus.EDITORIAL_REVIEW,
  ready_to_publish: ArticleStatus.READY_TO_PUBLISH,
  scheduled: ArticleStatus.SCHEDULED,
  published: ArticleStatus.PUBLISHED,
  archived: ArticleStatus.ARCHIVED,
};

const articleInclude = {
  author: true,
  category: true,
  tags: { include: { tag: true } },
} satisfies Prisma.ArticleInclude;

type ArticleWithRelations = Prisma.ArticleGetPayload<{ include: typeof articleInclude }>;

function mapArticle(article: ArticleWithRelations) {
  return {
    id: article.id,
    headline: article.headline,
    slug: article.slug,
    body: article.body,
    excerpt: article.excerpt ?? "",
    status: article.status.toLowerCase(),
    category: article.category?.name ?? "Uncategorized",
    categoryId: article.categoryId ?? null,
    author: article.author.name,
    breaking: article.breaking,
    views: article.views,
    tags: article.tags.map((t) => t.tag.name),
    seoTitle: article.seoTitle ?? "",
    seoDescription: article.seoDescription ?? "",
    scheduledAt: article.scheduledAt?.toISOString(),
    publishedAt: article.publishedAt?.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const article = await prisma.article.findUnique({ where: { id }, include: articleInclude });
    if (!article) return jsonError("Article not found", 404);
    return jsonOk({ article: mapArticle(article) });
  } catch (error) {
    return captureApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = articlePatchSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  try {
    const { id } = await params;

    const existing = await prisma.article.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    if (!existing) return jsonError("Article not found", 404);

    const updateData: Prisma.ArticleUpdateInput = {};
    if (parsed.data.headline !== undefined) updateData.headline = parsed.data.headline;
    if (parsed.data.body !== undefined) updateData.body = parsed.data.body;
    if (parsed.data.excerpt !== undefined) updateData.excerpt = parsed.data.excerpt;
    if (parsed.data.breaking !== undefined) updateData.breaking = parsed.data.breaking;
    if (parsed.data.seoTitle !== undefined) updateData.seoTitle = parsed.data.seoTitle;
    if (parsed.data.seoDescription !== undefined) updateData.seoDescription = parsed.data.seoDescription;
    if (parsed.data.scheduledAt !== undefined) updateData.scheduledAt = new Date(parsed.data.scheduledAt);

    if (parsed.data.status !== undefined) {
      const newStatus = statusMap[parsed.data.status];
      if (newStatus) {
        updateData.status = newStatus;
        if (newStatus === ArticleStatus.PUBLISHED && !existing.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }
    }

    const article = await prisma.article.update({
      where: { id },
      data: updateData,
      include: articleInclude,
    });

    await logAuditAction({
      action: "update_article",
      entity: "article",
      entityId: article.id,
      after: article,
    });

    return jsonOk({ article: mapArticle(article) });
  } catch (error) {
    return captureApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const article = await prisma.article.delete({ where: { id } });

    await logAuditAction({
      action: "delete_article",
      entity: "article",
      entityId: article.id,
    });

    return jsonOk({ message: "Article deleted successfully" });
  } catch (error) {
    return captureApiError(error);
  }
}
