/**
 * TakeToday — Site metadata
 * Single source of truth for canonical URL + site identity. Everything that
 * cares about external URLs (sitemap, RSS, OpenGraph, JSON-LD breadcrumbs)
 * reads from here, so one env var change rewires the whole site.
 *
 * Precedence:
 *   1. NEXT_PUBLIC_SITE_URL (set in Vercel when the custom domain lands)
 *   2. VERCEL_PROJECT_PRODUCTION_URL (set automatically on Vercel prod)
 *   3. Hardcoded fallback — the current Vercel preview alias
 */

import { appConfig } from "@/lib/config/app";

function resolveSiteUrl(): string {
  const explicit = appConfig.siteUrl;
  if (explicit) return stripTrailingSlash(explicit);

  const vercel = appConfig.vercelProjectProductionUrl;
  if (vercel) return `https://${stripTrailingSlash(vercel)}`;

  return "https://taketoday.vercel.app";
}

function stripTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

export const SITE = {
  url: resolveSiteUrl(),
  name: "TakeToday",
  tagline: "signal over noise",
  description:
    "Sharp, clear breakdowns of what actually matters in AI, finance, tech, and startups — for people who hate jargon and long reads.",
  locale: "en-US",
  author: "TakeToday Newsroom",
} as const;

/** Absolute URL helper — `abs("/article/foo")` → `https://…/article/foo`. */
export function abs(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${clean}`;
}