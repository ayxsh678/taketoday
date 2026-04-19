/**
 * TakeToday — Personalization storage
 *
 * All state lives in localStorage under a single key — no cookies, no backend.
 * Every function guards against SSR (window undefined) and quota errors.
 */

import type { Category } from "@/types/article";

const STORAGE_KEY = "tt_personalization_v1";
const MAX_HISTORY = 50; // keep the 50 most-recent reads

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReadEntry {
  slug: string;
  category: Category;
  readAt: number; // Unix ms
}

export interface PersonalizationData {
  recentlyRead: ReadEntry[];
}

const EMPTY: PersonalizationData = { recentlyRead: [] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isClient(): boolean {
  return typeof window !== "undefined";
}

// ─── Read / write ─────────────────────────────────────────────────────────────

export function loadPersonalizationData(): PersonalizationData {
  if (!isClient()) return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return JSON.parse(raw) as PersonalizationData;
  } catch {
    return EMPTY;
  }
}

function savePersonalizationData(data: PersonalizationData): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or unavailable — fail silently.
  }
}

// ─── Public mutations ─────────────────────────────────────────────────────────

/**
 * Records an article read. If the slug already exists it is moved to the
 * front (most-recent), so the list stays deduplicated and ordered.
 */
export function trackArticleRead(slug: string, category: Category): void {
  const data = loadPersonalizationData();

  const filtered = data.recentlyRead.filter((e) => e.slug !== slug);
  const updated: PersonalizationData = {
    recentlyRead: [
      { slug, category, readAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY),
  };

  savePersonalizationData(updated);
}
