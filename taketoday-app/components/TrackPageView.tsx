"use client";

/**
 * TakeToday — TrackPageView
 *
 * Zero-UI client component. Drop it anywhere in a page tree to fire a
 * personalization read event when the component mounts.
 *
 * Usage:
 *   <TrackPageView slug={article.slug} category={article.category} />
 */

import { useEffect } from "react";
import type { Category } from "@/types/article";
import { trackArticleRead } from "@/lib/personalization/storage";

interface Props {
  slug: string;
  category: Category;
}

export function TrackPageView({ slug, category }: Props) {
  useEffect(() => {
    trackArticleRead(slug, category);
  }, [slug, category]);

  return null;
}
