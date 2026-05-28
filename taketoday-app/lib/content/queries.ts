import { allArticles } from "contentlayer/generated";
import type { Category, Region } from "@/types/article";

/**
 * TakeToday — Content queries
 *
 * `ArticleDoc` mirrors the contentlayer-generated `Article` shape for the
 * fields the app actually uses. Exporting it lets consumers avoid importing
 * directly from `contentlayer/generated`, which doesn't exist until build time.
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

// Cast once at the boundary; everywhere downstream is properly typed.
function asArticles(): ArticleDoc[] {
  return allArticles as unknown as ArticleDoc[];
}

export function getAllArticles(): ArticleDoc[] {
  return asArticles().sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getFeaturedArticles(count: number): ArticleDoc[] {
  return getAllArticles().slice(0, count);
}

export function getArticleBySlug(slug: string): ArticleDoc | undefined {
  return getAllArticles().find((article) => article.slug === slug);
}

export function getArticlesByCategory(category: string): ArticleDoc[] {
  return getAllArticles().filter(
    (article) => article.category?.toLowerCase() === category.toLowerCase()
  );
}
