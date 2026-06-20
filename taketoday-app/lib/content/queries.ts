import "server-only";
import { prisma } from "@/lib/db/prisma";
import { ArticleStatus, Prisma } from "@prisma/client";
import type { Category, Region } from "@/types/article";

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

const ARTICLE_INCLUDE = {
  author: { select: { name: true } },
  category: { select: { name: true } },
} as const;

type ArticleRow = Prisma.ArticleGetPayload<{ include: typeof ARTICLE_INCLUDE }>;

function computeReadTime(body: string): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function toArticleDoc(row: ArticleRow): ArticleDoc {
  const category = (row.category?.name ?? "AI") as Category;
  const pub = (row.publishedAt ?? row.updatedAt).toISOString();
  return {
    slug: row.slug,
    title: row.headline,
    deck: row.excerpt ?? "",
    category,
    format: "article",
    region: "GLOBAL" as Region,
    readTime: computeReadTime(row.body),
    publishedAt: pub,
    updatedAt: row.updatedAt.toISOString(),
    author: { name: row.author.name, type: "Organization" },
    quickTake: row.excerpt ?? "",
    whyItMatters: "",
    takeaways: [],
    body: { raw: row.body },
  };
}

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
    orderBy: { publishedAt: "desc" },
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
      category: {
        name: { equals: category, mode: "insensitive" },
      },
    },
    include: ARTICLE_INCLUDE,
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(toArticleDoc);
}
