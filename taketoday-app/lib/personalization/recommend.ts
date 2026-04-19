/**
 * TakeToday — Recommendation engine (pure functions, no side effects)
 *
 * Scoring model:
 *   - Category affinity (0–100 pts): weighted by how often the user has read
 *     each category relative to their total reading history.
 *   - Recency bonus  (0–30 pts):  newer articles score slightly higher so
 *     fresh content surfaces even in unfamiliar categories.
 *   - Read penalty   (−1000 pts): articles the user has already opened sink
 *     to the bottom but remain visible.
 *
 * When the user has no history the original article order is preserved.
 */

import type { Article, Category } from "@/types/article";
import type { ReadEntry } from "./storage";

// ─── Category weights ─────────────────────────────────────────────────────────

/**
 * Converts a read history into per-category weights that sum to 1.
 * e.g. [AI×3, Finance×1] → { AI: 0.75, Finance: 0.25 }
 */
export function computeCategoryWeights(
  history: ReadEntry[],
): Map<Category, number> {
  if (history.length === 0) return new Map();

  const counts = new Map<Category, number>();
  for (const { category } of history) {
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  const total = history.length;
  const weights = new Map<Category, number>();
  for (const [cat, count] of counts) {
    weights.set(cat, count / total);
  }
  return weights;
}

/** Returns user's preferred categories, highest-affinity first. */
export function preferredCategories(history: ReadEntry[]): Category[] {
  return [...computeCategoryWeights(history).entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreArticle(
  article: Article,
  readSlugs: Set<string>,
  categoryWeights: Map<Category, number>,
): number {
  // Already read → push to the back.
  if (readSlugs.has(article.metadata.slug)) return -1000;

  // Category affinity: 0–100 pts.
  const affinity = (categoryWeights.get(article.metadata.category) ?? 0) * 100;

  // Recency bonus: 30 pts for today, decays 3 pts/day, floor at 0.
  const ageMs = Date.now() - new Date(article.metadata.publishedAt).getTime();
  const ageDays = ageMs / 86_400_000;
  const recency = Math.max(0, 30 - ageDays * 3);

  return affinity + recency;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a copy of `articles` sorted by personalization score.
 * Preserves the original order when there is no reading history.
 */
export function rankArticles(
  articles: readonly Article[],
  history: ReadEntry[],
): readonly Article[] {
  if (history.length === 0) return [...articles];

  const readSlugs = new Set(history.map((e) => e.slug));
  const weights = computeCategoryWeights(history);

  return [...articles].sort(
    (a, b) =>
      scoreArticle(b, readSlugs, weights) -
      scoreArticle(a, readSlugs, weights),
  );
}
