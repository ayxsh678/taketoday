import { NextRequest } from "next/server";
import { ArticleStatus, Prisma } from "@prisma/client";
import { articleMutationSchema, jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { logAuditAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/authz";
import { getOrCreateAdminUser } from "@/lib/admin/current-user";
import { prisma } from "@/lib/db/prisma";

const statusMap: Record<string, ArticleStatus> = {
  draft: ArticleStatus.DRAFT,
  under_review: ArticleStatus.UNDER_REVIEW,
  approved: ArticleStatus.APPROVED,
  scheduled: ArticleStatus.SCHEDULED,
  published: ArticleStatus.PUBLISHED,
  archived: ArticleStatus.ARCHIVED,
};

export async function GET(req: NextRequest) {
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  const q = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";
  const status = req.nextUrl.searchParams.get("status");
  const where: Prisma.ArticleWhereInput = {};

  if (q) {
    where.OR = [
      { headline: { contains: q, mode: "insensitive" } },
      { subheadline: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
    ];
  }

  if (status) {
    const normalized = statusMap[status.toLowerCase()];
    if (!normalized) return jsonError("Invalid article status", 422);
    where.status = normalized;
  }

    try {
      const articles = await prisma.article.findMany({
        where,
        include: {
          author: true,
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      const mappedArticles = articles.map((article) => ({
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
      }));

      return jsonOk({ articles: mappedArticles, total: mappedArticles.length, page: 1, pageSize: 25 });
    } catch (error) {
      if (error instanceof Error) {
        // Prisma unique constraint error
        const prismaError = error as { code?: string };
        if (prismaError.code === 'P2002') {
          return jsonError('A record with this slug already exists.', 400);
        }
        return jsonError(error.message, 500);
      }
      return jsonError('Failed to fetch articles', 500);
    }
}

export async function POST(req: NextRequest) {
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = articleMutationSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  try {
    const author = await getOrCreateAdminUser(access.session);
    const article = await prisma.article.create({
      data: {
        headline: parsed.data.headline,
        subheadline: parsed.data.subheadline,
        slug: parsed.data.slug,
        body: parsed.data.body ?? "",
        priorityScore: parsed.data.priorityScore,
        status: statusMap[parsed.data.status] ?? ArticleStatus.DRAFT,
        authorId: author.id,
      },
    });

    await logAuditAction({
      action: "create_article",
      entity: "article",
      entityId: article.id,
      after: article,
    });

    return jsonOk({ article: { ...article, status: article.status.toLowerCase() } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      // Prisma unique constraint error
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        return jsonError('An article with this slug already exists.', 400);
      }
      return jsonError(error.message, 500);
    }
    return jsonError('Failed to create article', 500);
  }
}

export async function PUT(req: NextRequest) {
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  // For PUT requests with ID in URL, we need to get it from the path
  // Since we now have a proper [id]/route.ts, we should delegate to that
  // For now, let's return an error indicating we need a proper ID-based route
  return jsonError("PUT operation requires article ID. Use /api/admin/articles/[id] endpoint", 405);
}

export async function DELETE(req: NextRequest) {
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  // Similar to PUT, DELETE needs an ID
  return jsonError("DELETE operation requires article ID. Use /api/admin/articles/[id] endpoint", 405);
}
