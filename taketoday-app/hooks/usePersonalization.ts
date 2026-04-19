"use client";

/**
 * TakeToday — usePersonalization hook
 *
 * Returns personalized article rankings and user preferences derived
 * entirely from localStorage — no server round-trips.
 *
 * Usage:
 *   const { recommendedArticles, userPreferences, trackRead } =
 *     usePersonalization(allArticles);
 */

import { useCallback, useEffect, useState } from "react";
import type { Article, Category } from "@/types/article";
import {
  loadPersonalizationData,
  trackArticleRead,
  type ReadEntry,
  MAX_HISTORY,
} from "@/lib/personalization/storage";
import {
  rankArticles,
  preferredCategories,
} from "@/lib/personalization/recommend";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface UserPreferences {
  /** User's top categories, highest-affinity first. Empty until first read. */
  preferredCategories: Category[];
  /** Slugs of articles opened this session + past sessions (newest first). */
  recentlyRead: string[];
}

export interface PersonalizationResult {
  /** `allArticles` re-ranked by affinity + recency; read articles move down. */
  recommendedArticles: readonly Article[];
  userPreferences: UserPreferences;
  /** Call this when the user opens an article to update their profile. */
  trackRead: (slug: string, category: Category) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePersonalization(
  allArticles: readonly Article[],
): PersonalizationResult {
  const [history, setHistory] = useState<ReadEntry[]>([]);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setHistory(loadPersonalizationData().recentlyRead);
  }, []);

  const trackRead = useCallback((slug: string, category: Category) => {
    // Persist to localStorage.
    trackArticleRead(slug, category);
    // Update React state directly from the previous value — no extra
    // localStorage read needed.
    setHistory((prev) => {
      const filtered = prev.filter((e) => e.slug !== slug);
      return [{ slug, category, readAt: Date.now() }, ...filtered].slice(
        0,
        MAX_HISTORY,
      );
    });
  }, []);

  return {
    recommendedArticles: rankArticles(allArticles, history),
    userPreferences: {
      preferredCategories: preferredCategories(history),
      recentlyRead: history.map((e) => e.slug),
    },
    trackRead,
  };
}
