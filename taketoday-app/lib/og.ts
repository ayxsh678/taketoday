/**
 * TakeToday — OG image URL builder
 *
 * Single place to construct /api/og URLs so callers don't duplicate
 * the query-string logic.
 */

import { SITE } from "@/lib/site";

interface OgImageParams {
  title: string;
  deck?: string;
  category?: string;
}

export function buildOgImageUrl({ title, deck, category }: OgImageParams): string {
  const params: Record<string, string> = { title };
  if (deck) params.deck = deck;
  if (category) params.category = category;
  return `${SITE.url}/api/og?${new URLSearchParams(params).toString()}`;
}
