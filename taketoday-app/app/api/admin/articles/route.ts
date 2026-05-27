import { NextRequest } from "next/server";
import { ArticleStatus, Prisma } from "@prisma/client";
import { articleCreateSchema, captureApiError, jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
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

function slugifyTag(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  if (rateLimit(req)) return jsonError("Rate limit exceeded. Please try again later.", 429);

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
    }));

    return jsonOk({ articles: mappedArticles, total: mappedArticles.length });
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") return jsonError("A record with this slug already exists.", 400);
    return captureApiError(error);
  }
}

export async function POST(req: NextRequest) {
  if (rateLimit(req)) return jsonError("Rate limit exceeded. Please try again later.", 429);

  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = articleCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  try {
    const author = await getOrCreateAdminUser(access.session);
    const newStatus = statusMap[parsed.data.status] ?? ArticleStatus.DRAFT;

    const article = await prisma.$transaction(async (tx) => {
      // 1. Create article
      const created = await tx.article.create({
        data: {
          headline: parsed.data.headline,
          subheadline: parsed.data.subheadline,
          slug: parsed.data.slug,
          body: parsed.data.body,
          priorityScore: parsed.data.priorityScore,
          breaking: parsed.data.breaking,
          status: newStatus,
          language: parsed.data.language,
          location: parsed.data.location ?? null,
          seoTitle: parsed.data.seoTitle ?? null,
          seoDescription: parsed.data.seoDescription ?? null,
          scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
          publishedAt: newStatus === ArticleStatus.PUBLISHED ? new Date() : null,
          authorId: author.id,
        },
      });

      // 2. Link category if provided
      if (parsed.data.categoryId) {
        await tx.articleCategory.create({
          data: { articleId: created.id, categoryId: parsed.data.categoryId },
        });
      }

      // 3. Upsert and link tags
      for (const tagName of parsed.data.tags) {
        const slug = slugifyTag(tagName);
        if (!slug) continue;
        const tag = await tx.tag.upsert({
          where: { slug },
          update: {},
          create: { name: tagName.trim(), slug },
        });
        await tx.articleTag.create({
          data: { articleId: created.id, tagId: tag.id },
        });
      }

      return created;
    });

    // Reload with relations for the response
    const full = await prisma.article.findUniqueOrThrow({
      where: { id: article.id },
      include: {
        author: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });

    await logAuditAction({
      action: "create_article",
      entity: "article",
      entityId: full.id,
      after: full,
    });

    return jsonOk(
      {
        article: {
          id: full.id,
          headline: full.headline,
          subheadline: full.subheadline,
          slug: full.slug,
          status: full.status.toLowerCase(),
          category: full.categories[0]?.category.name ?? "Uncategorized",
          author: full.author.name,
          priorityScore: full.priorityScore,
          language: full.language,
          location: full.location ?? "",
          breaking: full.breaking,
          tags: full.tags.map((t) => t.tag.name),
          seoTitle: full.seoTitle ?? "",
          seoDescription: full.seoDescription ?? "",
          publishedAt: full.publishedAt?.toISOString(),
          updatedAt: full.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") return jsonError("An article with this slug already exists.", 409);
    if (prismaError.code === "P2003") return jsonError("Invalid category ID.", 422);
    return captureApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  if (rateLimit(req)) return jsonError("Rate limit exceeded. Please try again later.", 429);
  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;
  return jsonError("PUT requires article ID. Use /api/admin/articles/[id]", 405);
}

export async function DELETE(req: NextRequest) {
  if (rateLimit(req)) return jsonError("Rate limit exceeded. Please try again later.", 429);
  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;
  return jsonError("DELETE requires article ID. Use /api/admin/articles/[id]", 405);
}
