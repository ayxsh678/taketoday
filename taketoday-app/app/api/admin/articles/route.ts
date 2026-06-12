import { articleCreateSchema, captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { ArticleStatus, Prisma } from "@prisma/client";
import { logAuditAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/authz";
import { getOrCreateAdminUser } from "@/lib/admin/current-user";
import { prisma } from "@/lib/db/prisma";

const statusMap: Record<string, ArticleStatus> = {
  draft: ArticleStatus.DRAFT,
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

export async function GET(req: NextRequest) {
  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  const q = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";
  const status = req.nextUrl.searchParams.get("status");
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;
  const where: Prisma.ArticleWhereInput = {};

  if (q) {
    where.OR = [
      { headline: { contains: q, mode: "insensitive" } },
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
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    return jsonOk({
      articles: articles.map(mapArticle),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") return jsonError("A record with this slug already exists.", 400);
    return captureApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = articleCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  try {
    const author = await getOrCreateAdminUser(access.session);
    const newStatus = statusMap[parsed.data.status] ?? ArticleStatus.DRAFT;

    const article = await prisma.$transaction(async (tx) => {
      const created = await tx.article.create({
        data: {
          headline: parsed.data.headline,
          slug: parsed.data.slug,
          body: parsed.data.body,
          excerpt: parsed.data.excerpt ?? null,
          breaking: parsed.data.breaking,
          status: newStatus,
          categoryId: parsed.data.categoryId ?? null,
          seoTitle: parsed.data.seoTitle ?? null,
          seoDescription: parsed.data.seoDescription ?? null,
          scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
          publishedAt: newStatus === ArticleStatus.PUBLISHED ? new Date() : null,
          authorId: author.id,
        },
      });

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

    const full = await prisma.article.findUniqueOrThrow({
      where: { id: article.id },
      include: articleInclude,
    });

    await logAuditAction({
      action: "create_article",
      entity: "article",
      entityId: full.id,
      after: full,
    });

    return jsonOk({ article: mapArticle(full) }, { status: 201 });
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") return jsonError("An article with this slug already exists.", 409);
    if (prismaError.code === "P2003") return jsonError("Invalid category ID.", 422);
    return captureApiError(error);
  }
}

export async function PUT(_req: NextRequest) {
  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;
  return jsonError("PUT requires article ID. Use /api/admin/articles/[id]", 405);
}

export async function DELETE(_req: NextRequest) {
  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;
  return jsonError("DELETE requires article ID. Use /api/admin/articles/[id]", 405);
}
