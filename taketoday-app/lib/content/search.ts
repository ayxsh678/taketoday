import { getAllArticles, type ArticleDoc } from "@/lib/content/queries";
import type { FeedItem } from "@/types/article";

/**
 * TakeToday — Article search
 * Shared scoring logic used by /api/search (API) and /search (page SSR).
 * Weighted field scoring — title > deck > quickTake > category > whyItMatters.
 */

function score(article: ArticleDoc, q: string): number {
  const lq = q.toLowerCase();
  const { title, deck, category, quickTake, whyItMatters } = article;

  let s = 0;
  if (title.toLowerCase().includes(lq)) s += 10;
  if (deck.toLowerCase().includes(lq)) s += 6;
  if (quickTake.toLowerCase().includes(lq)) s += 4;
  if (category.toLowerCase().includes(lq)) s += 3;
  if (whyItMatters.toLowerCase().includes(lq)) s += 2;
  return s;
}

export function searchArticles(q: string, limit = 8): FeedItem[] {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];

  return getAllArticles()
    .map((a) => ({ article: a, s: score(a, trimmed) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ article: a }) => ({
      slug: a.slug,
      title: a.title,
      summary: a.quickTake,
      category: a.category,
      readTime: a.readTime,
      publishedAt: a.publishedAt,
    }));
}
