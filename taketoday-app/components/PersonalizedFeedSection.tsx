"use client";

/**
 * TakeToday — PersonalizedFeedSection
 *
 * Client wrapper around FeedSection. Receives all articles from the server
 * as props (server-first), then filters and re-ranks them client-side:
 *   1. Local articles (region matches user's country) — shown first, ranked by affinity
 *   2. Global articles (region === "GLOBAL") — shown after, ranked by affinity
 *
 * Server renders the skeleton → client hydrates with geo-personalised order.
 * No API calls, no loading states — purely localStorage + navigator derived.
 */

import type { Article } from "@/types/article";
import { FeedSection } from "@/components/FeedSection";
import { usePersonalization } from "@/hooks/usePersonalization";

interface Props {
  articles: readonly Article[];
}

export function PersonalizedFeedSection({ articles }: Props) {
  const { localArticles, globalArticles } = usePersonalization(articles);
  // Local articles surface first; global fills the rest of the feed.
  const feed = [...localArticles, ...globalArticles];
  return <FeedSection items={feed} />;
}
