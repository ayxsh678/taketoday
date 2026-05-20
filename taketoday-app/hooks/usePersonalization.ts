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
import type { Article } from "contentlayer/generated";
import type { Category } from "@/types/article";
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
import {
  getCountryPreference,
} from "@/lib/personalization/countryPreference";
import {
  getLangPreference,
  type SiteLang,
} from "@/lib/personalization/langPreference";
import {
  isUserCountry,
  isSiteLang,
} from "@/lib/personalization/preferenceUtils";

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
  /** Articles whose region matches the user's detected/chosen country, ranked. */
  localArticles: readonly Article[];
  /** Articles with region === "GLOBAL", ranked. */
  globalArticles: readonly Article[];
  userPreferences: UserPreferences;
  /** Active country — cookie override if set, otherwise navigator-detected. */
  userCountry: UserCountry;
  /** Active language preference (cookie-persisted). */
  userLang: SiteLang;
  /** Call this when the user opens an article to update their profile. */
  trackRead: (slug: string, category: Category) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePersonalization(
  allArticles: readonly Article[],
): PersonalizationResult {
  const [history, setHistory] = useState<ReadEntry[]>([]);
  const [userCountry, setUserCountry] = useState<UserCountry>("IN");
  const [userLang, setUserLang] = useState<SiteLang>("en");

  // Hydrate from localStorage + cookies + navigator after mount.
  useEffect(() => {
    setHistory(loadPersonalizationData().recentlyRead);
    setUserCountry(getCountryPreference() ?? getUserCountry());
    setUserLang(getLangPreference());
  }, []);

  // React to in-session preference changes dispatched by NavbarControls.
  useEffect(() => {
    function onCountryChanged(e: Event) {
      const next = (e as CustomEvent<string>).detail;
      // "auto" means clear override — fall back to navigator detection.
      setUserCountry(isUserCountry(next) ? next : getUserCountry());
    }
    function onLangChanged(e: Event) {
      const next = (e as CustomEvent<string>).detail;
      if (isSiteLang(next)) setUserLang(next);
    }
    window.addEventListener("tt:country-changed", onCountryChanged);
    window.addEventListener("tt:lang-changed", onLangChanged);
    return () => {
      window.removeEventListener("tt:country-changed", onCountryChanged);
      window.removeEventListener("tt:lang-changed", onLangChanged);
    };
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
    () => rankArticles(allArticles.filter((a) => a.region === userCountry), history),
    [allArticles, userCountry, history],
  );

  const globalArticles = useMemo(
    () => rankArticles(allArticles.filter((a) => a.region === "GLOBAL"), history),
    [allArticles, history],
  );

  return {
    recommendedArticles: rankArticles(allArticles, history),
    localArticles,
    globalArticles,
    userCountry,
    userLang,
    userPreferences: {
      preferredCategories: preferredCategories(history),
      recentlyRead: history.map((e) => e.slug),
    },
    trackRead,
  };
}
