import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { FeedItem, Category } from "@/types/article";

const VALID_CATEGORIES = new Set<string>([
  "AI", "Finance", "Tech", "Startups", "Briefings", "India", "International",
]);

function toCategory(name: string | null): Category {
  return (name && VALID_CATEGORIES.has(name) ? name : "AI") as Category;
}

function computeReadTime(body: string): string {
  const words = body.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

interface FtsRow {
  slug: string;
  headline: string;
  excerpt: string | null;
  body: string;
  category_name: string | null;
  published_at: Date | null;
}

export async function searchArticles(q: string, limit = 20): Promise<FeedItem[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];

  try {
    const rows = await prisma.$queryRaw<FtsRow[]>`
      WITH query AS (SELECT plainto_tsquery('english', ${trimmed}) AS tsq)
      SELECT
        a.slug,
        a.headline,
        a.excerpt,
        a.body,
        c.name          AS category_name,
        a."publishedAt" AS published_at
      FROM "Article" a
      CROSS JOIN query
      LEFT JOIN "Category" c ON c.id = a."categoryId"
      WHERE a.status = 'PUBLISHED'::"ArticleStatus"
        AND a."searchVector" @@ query.tsq
      ORDER BY ts_rank(a."searchVector", query.tsq) DESC
      LIMIT ${limit}
    `;

    return rows.map((r) => ({
      slug: r.slug,
      title: r.headline,
      summary: r.excerpt ?? "",
      category: toCategory(r.category_name),
      readTime: computeReadTime(r.body),
      publishedAt: r.published_at?.toISOString() ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}
