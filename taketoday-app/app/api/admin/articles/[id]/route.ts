import { NextRequest } from "next/server";
import { ArticleStatus } from "@prisma/client";
import { articleMutationSchema, jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { logAuditAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/authz";
import { getOrCreateAdminUser } from "@/lib/admin/current-user";
import { prisma } from "@/lib/db/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const statusMap: Record<string, ArticleStatus> = {
  draft: ArticleStatus.DRAFT,
  under_review: ArticleStatus.UNDER_REVIEW,
  approved: ArticleStatus.APPROVED,
  scheduled: ArticleStatus.SCHEDULED,
  published: ArticleStatus.PUBLISHED,
  archived: ArticleStatus.ARCHIVED,
};

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!article) {
      return jsonError("Article not found", 404);
    }

    const mappedArticle = {
      id: article.id,
      headline: article.headline,
      subheadline: article.subheadline,
      slug: article.slug,
      status: article.status.toLowerCase(),
      category: article.categories[0]?.category.name ?? "Uncategorized",
      author: article.author.name,
      priorityScore: article.priorityScore,
      language: article.language,
      location: article.location,
      breaking: article.breaking,
      tags: article.tags.map((tag) => tag.tag.name),
      seoTitle: article.seoTitle ?? "",
      seoDescription: article.seoDescription ?? "",
      sourceLink: article.sourceLink ?? undefined,
      canonicalUrl: article.canonicalUrl ?? undefined,
      scheduledAt: article.scheduledAt?.toISOString(),
      publishedAt: article.publishedAt?.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    };

    return jsonOk({ article: mappedArticle });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch article";
    return jsonError(message, 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = articleMutationSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  try {
    const { id } = await params;
    const author = await getOrCreateAdminUser(access.session);
    const article = await prisma.article.update({
      where: { id },
      data: {
        headline: parsed.data.headline,
        subheadline: parsed.data.subheadline,
        slug: parsed.data.slug,
        body: parsed.data.body ?? "",
        priorityScore: parsed.data.priorityScore,
        status: statusMap[parsed.data.status] ?? ArticleStatus.DRAFT,
        authorId: author.id,
      },
      include: {
        author: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });

    await logAuditAction({
      action: "update_article",
      entity: "article",
      entityId: article.id,
      after: article,
    });

    const mappedArticle = {
      id: article.id,
      headline: article.headline,
      subheadline: article.subheadline,
      slug: article.slug,
      status: article.status.toLowerCase(),
      category: article.categories[0]?.category.name ?? "Uncategorized",
      author: article.author.name,
      priorityScore: article.priorityScore,
      language: article.language,
      location: article.location,
      breaking: article.breaking,
      tags: article.tags.map((tag) => tag.tag.name),
      seoTitle: article.seoTitle ?? "",
      seoDescription: article.seoDescription ?? "",
      sourceLink: article.sourceLink ?? undefined,
      canonicalUrl: article.canonicalUrl ?? undefined,
      scheduledAt: article.scheduledAt?.toISOString(),
      publishedAt: article.publishedAt?.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    };

    return jsonOk({ article: mappedArticle });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update article";
    return jsonError(message, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const article = await prisma.article.delete({
      where: { id },
    });

    await logAuditAction({
      action: "delete_article",
      entity: "article",
      entityId: article.id,
    });

    return jsonOk({ message: "Article deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete article";
    return jsonError(message, 500);
  }
}