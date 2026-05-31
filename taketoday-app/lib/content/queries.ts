import "server-only";
import { prisma } from "@/lib/db/prisma";
import { ArticleStatus } from "@prisma/client";
import type { Category, Region } from "@/types/article";

/**
 * TakeToday — Content queries (DB-backed)
 *
 * All functions are async and read from the Article table with status=PUBLISHED.
 * `ArticleDoc` keeps the same shape as before so all page/component callers
 * continue to work without touching downstream types.
 *
 * Migration: run `scripts/migrate-mdx-to-db.ts` once to seed the 20 existing
 * MDX articles into the DB. After that, the public site reads entirely from DB.
 */

export interface ArticleDoc {
  slug: string;
  title: string;
  deck: string;
  category: Category;
  format: string;
  region: Region;
  readTime: string;
  publishedAt: string;
  updatedAt?: string;
  author: { name: string; type: string };
  quickTake: string;
  whyItMatters: string;
  takeaways: string[];
  body: { raw: string };
}

// ─── DB include shape ────────────────────────────────────────────────────────

const ARTICLE_INCLUDE = {
  author: { select: { name: true } },
  categories: {
    include: { category: { select: { name: true } } },
  },
} as const;

type ArticleRow = {
  slug: string;
  headline: string;
  subheadline: string;
  body: string;
  publishedAt: Date | null;
  updatedAt: Date;
  quickTake: string | null;
  whyItMatters: string | null;
  takeaways: string[];
  format: string;
  region: string;
  author: { name: string };
  categories: Array<{ category: { name: string } }>;
};

// ─── Mapper ───────────────────────────────────────────────────────────────────

function computeReadTime(body: string): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function toArticleDoc(row: ArticleRow): ArticleDoc {
  const category = (row.categories[0]?.category.name ?? "AI") as Category;
  const pub = (row.publishedAt ?? row.updatedAt).toISOString();
  return {
    slug: row.slug,
    title: row.headline,
    deck: row.subheadline,
    category,
    format: row.format,
    region: row.region as Region,
    readTime: computeReadTime(row.body),
    publishedAt: pub,
    updatedAt: row.updatedAt.toISOString(),
    author: { name: row.author.name, type: "Organization" },
    quickTake: row.quickTake ?? "",
    whyItMatters: row.whyItMatters ?? "",
    takeaways: row.takeaways,
    body: { raw: row.body },
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAllArticles(): Promise<ArticleDoc[]> {
  const rows = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    include: ARTICLE_INCLUDE,
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(toArticleDoc);
}

export async function getFeaturedArticles(count: number): Promise<ArticleDoc[]> {
  const rows = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    include: ARTICLE_INCLUDE,
    orderBy: [{ priorityScore: "desc" }, { publishedAt: "desc" }],
    take: count,
  });
  return rows.map(toArticleDoc);
}

export async function getArticleBySlug(slug: string): Promise<ArticleDoc | undefined> {
  const row = await prisma.article.findFirst({
    where: { slug, status: ArticleStatus.PUBLISHED },
    include: ARTICLE_INCLUDE,
  });
  return row ? toArticleDoc(row) : undefined;
}

export async function getArticlesByCategory(category: string): Promise<ArticleDoc[]> {
  const rows = await prisma.article.findMany({
    where: {
      status: ArticleStatus.PUBLISHED,
      categories: {
        some: {
          category: {
            name: { equals: category, mode: "insensitive" },
          },
        },
      },
    },
    include: ARTICLE_INCLUDE,
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(toArticleDoc);
}
