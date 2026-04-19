"use client";

/**
 * TakeToday — PersonalizedFeedSection
 *
 * Client wrapper around FeedSection. Receives all articles from the server
 * as props (server-first), then re-ranks them client-side using
 * usePersonalization before passing them down to the presentational layer.
 *
 * Server renders the skeleton → client hydrates with personalized order.
 * No API calls, no loading states — purely localStorage-derived.
 */

import type { Article } from "@/types/article";
import { FeedSection } from "@/components/FeedSection";
import { usePersonalization } from "@/hooks/usePersonalization";

interface Props {
  articles: readonly Article[];
}

export function PersonalizedFeedSection({ articles }: Props) {
  const { recommendedArticles } = usePersonalization(articles);
  return <FeedSection items={recommendedArticles} />;
}
