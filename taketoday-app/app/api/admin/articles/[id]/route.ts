import { NextRequest } from "next/server";
import { ArticleStatus, Prisma } from "@prisma/client";
import { articlePatchSchema, jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { logAuditAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/authz";
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

function mapArticle(article: Awaited<ReturnType<typeof prisma.article.findUniqueOrThrow>> & {
  author: { name: string };
  categories: { category: { name: string } }[];
  tags: { tag: { name: string } }[];
}) {
  return {
    id: article.id,
    headline: article.headline,
    subheadline: article.subheadline,
    slug: article.slug,
    status: article.status.toLowerCase(),
    category: article.categories[0]?.category.name ?? "Uncategorized",
    author: article.author.name,
    priorityScore: article.priorityScore,
    language: article.language,
    location: article.location ?? "",
    breaking: article.breaking,
    tags: article.tags.map((t) => t.tag.name),
    seoTitle: article.seoTitle ?? "",
    seoDescription: article.seoDescription ?? "",
    sourceLink: article.sourceLink ?? undefined,
    canonicalUrl: article.canonicalUrl ?? undefined,
    scheduledAt: article.scheduledAt?.toISOString(),
    publishedAt: article.publishedAt?.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}

const articleInclude = {
  author: true,
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.ArticleInclude;

export async function GET(req: NextRequest, { params }: RouteContext) {
  if (rateLimit(req)) return jsonError("Rate limit exceeded. Please try again later.", 429);

  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const article = await prisma.article.findUnique({ where: { id }, include: articleInclude });
    if (!article) return jsonError("Article not found", 404);
    return jsonOk({ article: mapArticle(article) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch article", 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  if (rateLimit(req)) return jsonError("Rate limit exceeded. Please try again later.", 429);

  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = articlePatchSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  try {
    const { id } = await params;

    // Check article exists and grab fields needed for conditional logic
    const existing = await prisma.article.findUnique({
      where: { id },
      select: { publishedAt: true },
    });
    if (!existing) return jsonError("Article not found", 404);

    // Build update payload — only include fields that were provided
    const updateData: Prisma.ArticleUpdateInput = {};
    if (parsed.data.headline !== undefined) updateData.headline = parsed.data.headline;
    if (parsed.data.subheadline !== undefined) updateData.subheadline = parsed.data.subheadline;
    if (parsed.data.body !== undefined) updateData.body = parsed.data.body;
    if (parsed.data.priorityScore !== undefined) updateData.priorityScore = parsed.data.priorityScore;
    if (parsed.data.breaking !== undefined) updateData.breaking = parsed.data.breaking;
    if (parsed.data.seoTitle !== undefined) updateData.seoTitle = parsed.data.seoTitle;
    if (parsed.data.seoDescription !== undefined) updateData.seoDescription = parsed.data.seoDescription;

    if (parsed.data.status !== undefined) {
      const newStatus = statusMap[parsed.data.status];
      updateData.status = newStatus;
      // Stamp publishedAt only on first publication
      if (newStatus === ArticleStatus.PUBLISHED && !existing.publishedAt) {
        updateData.publishedAt = new Date();
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
    return jsonError(error instanceof Error ? error.message : "Failed to update article", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  if (rateLimit(req)) return jsonError("Rate limit exceeded. Please try again later.", 429);

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
    return jsonError(error instanceof Error ? error.message : "Failed to delete article", 500);
  }
}
