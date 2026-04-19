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

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  getUserCountry,
  type UserCountry,
} from "@/lib/personalization/getUserCountry";

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
  /** Articles whose region matches the user's detected country, ranked. */
  localArticles: readonly Article[];
  /** Articles with region === "GLOBAL", ranked. */
  globalArticles: readonly Article[];
  userPreferences: UserPreferences;
  /** Detected country code (falls back to "IN" when unavailable). */
  userCountry: UserCountry;
  /** Call this when the user opens an article to update their profile. */
  trackRead: (slug: string, category: Category) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePersonalization(
  allArticles: readonly Article[],
): PersonalizationResult {
  const [history, setHistory] = useState<ReadEntry[]>([]);
  const [userCountry, setUserCountry] = useState<UserCountry>("IN");

  // Hydrate from localStorage + navigator after mount (avoids SSR mismatch).
  useEffect(() => {
    setHistory(loadPersonalizationData().recentlyRead);
    setUserCountry(getUserCountry());
  }, []);

  const trackRead = useCallback((slug: string, category: Category) => {
    trackArticleRead(slug, category);
    setHistory((prev) => {
      const filtered = prev.filter((e) => e.slug !== slug);
      return [{ slug, category, readAt: Date.now() }, ...filtered].slice(
        0,
        MAX_HISTORY,
      );
    });
  }, []);

  const localArticles = useMemo(
    () => rankArticles(allArticles.filter((a) => a.metadata.region === userCountry), history),
    [allArticles, userCountry, history],
  );

  const globalArticles = useMemo(
    () => rankArticles(allArticles.filter((a) => a.metadata.region === "GLOBAL"), history),
    [allArticles, history],
  );

  return {
    recommendedArticles: rankArticles(allArticles, history),
    localArticles,
    globalArticles,
    userCountry,
    userPreferences: {
      preferredCategories: preferredCategories(history),
      recentlyRead: history.map((e) => e.slug),
    },
    trackRead,
  };
}
