"use client";

/**
 * TakeToday — CategoryArticleGrid
 * Client component wrapping the article grid on /category/[category].
 * Handles progressive "Load more" pagination without a server round-trip.
 */

import { useState } from "react";
import { NewsCard } from "@/components/NewsCard";
import type { Category } from "@/types/article";

interface ArticleSummary {
  slug: string;
  title: string;
  quickTake: string;
  category: Category;
  readTime: string;
  publishedAt: string;
}

interface Props {
  articles: ArticleSummary[];
  pageSize?: number;
}

export function CategoryArticleGrid({ articles, pageSize = 9 }: Props) {
  const [visible, setVisible] = useState(pageSize);

  const shown = articles.slice(0, visible);
  const hasMore = visible < articles.length;
  const remaining = articles.length - visible;

  if (articles.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400">
          Nothing filed yet
        </p>
        <p className="mt-3 text-[14px] text-ink-500">
          Check back soon — the desk is filing.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
        {shown.map((a) => (
          <NewsCard
            key={a.slug}
            slug={a.slug}
            title={a.title}
            summary={a.quickTake}
            category={a.category}
            readTime={a.readTime}
            publishedAt={a.publishedAt}
            variant="grid"
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-14 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setVisible((n) => n + pageSize)}
            className="inline-flex items-center rounded-full border border-ink-300 text-ink px-6 py-2.5 text-[13px] font-medium tracking-wide hover:border-ink hover:bg-ink hover:text-paper transition-colors"
          >
            Load {Math.min(remaining, pageSize)} more
          </button>
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400">
            {shown.length} of {articles.length} stories
          </p>
        </div>
      )}
    </>
  );
}
