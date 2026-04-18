import "server-only";
import type { Article, Category, FeedItem } from "@/types/article";
import { loadAllArticles } from "@/lib/content/loader";

/**
 * TakeToday — Content queries
 * The single public surface for reading article data. Every route (home,
 * category pages, article pages) goes through these functions — never
 * directly against the loader or the filesystem.
 *
 * All functions are synchronous because the underlying loader is synchronous
 * at build time. Articles come back already sorted newest-first from the
 * loader, so callers can rely on order without re-sorting.
 */

/** Every article, newest-first. */
export function getAllArticles(): readonly Article[] {
  return loadAllArticles();
}

/** Fetch a single article by slug, or `null` when it doesn't exist. */
export function getArticle(slug: string): Article | null {
  const articles = loadAllArticles();
  return articles.find((a) => a.metadata.slug === slug) ?? null;
}

/** Articles within a single category, newest-first. */
export function getArticlesByCategory(
  category: Category
): readonly Article[] {
  return loadAllArticles().filter((a) => a.metadata.category === category);
}

/**
 * The top `count` articles for the homepage hero / featured rail.
 * Currently just newest-first; a future `featured: true` frontmatter flag
 * can override this without changing the call sites.
 */
export function getFeaturedArticles(count: number): readonly Article[] {
  if (count <= 0) return [];
  return loadAllArticles().slice(0, count);
}

/**
 * Lightweight projection used by list/grid components that don't need the
 * MDX body. Keeps card payloads tiny.
 */
export function toFeedItem(article: Article): FeedItem {
  return {
    slug: article.metadata.slug,
    title: article.metadata.title,
    summary: article.content.quickTake,
    category: article.metadata.category,
    readTime: article.metadata.readTime,
    publishedAt: article.metadata.publishedAt,
  };
}

/** Convenience: every article as a `FeedItem`. */
export function getAllFeedItems(): readonly FeedItem[] {
  return loadAllArticles().map(toFeedItem);
}
