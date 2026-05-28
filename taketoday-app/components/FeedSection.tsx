"use client";

import { useState } from "react";
import { NewsCard } from "@/components/NewsCard";
import { SectionShell } from "@/components/SectionShell";
import type { Article } from "contentlayer/generated";
import { CATEGORIES, type Category } from "@/types/article";

export type FeedSectionProps = Readonly<{
  items: readonly Article[];
}>;

type Filter = Category | "All";
const FILTERS: readonly Filter[] = ["All", ...CATEGORIES];
const PAGE_SIZE = 6;

export function FeedSection({ items }: FeedSectionProps) {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered =
    activeFilter === "All"
      ? items
      : items.filter((a) => a.category === activeFilter);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function handleFilter(f: Filter) {
    setActiveFilter(f);
    setVisibleCount(PAGE_SIZE); // reset pagination on filter change
  }

  return (
    <SectionShell labelledBy="feed-heading">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 lg:mb-16">
        <h2
          id="feed-heading"
          className="font-serif italic text-[32px] lg:text-[40px] tracking-tight text-ink"
        >
          The Feed
        </h2>

        <div
          role="tablist"
          aria-label="Filter by section"
          className="flex flex-wrap items-center gap-2"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={activeFilter === f}
              type="button"
              onClick={() => handleFilter(f)}
              className={
                activeFilter === f
                  ? "rounded-full bg-ink text-paper px-3.5 py-1.5 text-[12px] font-medium tracking-wide"
                  : "rounded-full border border-ink-200 text-ink-700 px-3.5 py-1.5 text-[12px] hover:border-ink-300 hover:text-ink transition-colors"
              }
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-400">
            No stories in this section yet
          </p>
          <p className="mt-3 text-[14px] text-ink-500">
            Check back soon — the desk is filing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
          {visible.map((a) => (
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
      )}

      {hasMore && (
        <div className="mt-16 lg:mt-20 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            className="inline-flex items-center rounded-full border border-ink-300 text-ink px-5 py-2.5 text-[13px] font-medium tracking-wide hover:border-ink hover:bg-ink hover:text-paper transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </SectionShell>
  );
}

export function FeedSectionSkeleton() {
  return (
    <SectionShell ariaHidden>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 lg:mb-16">
        <div className="h-9 w-24 rounded bg-ink-100 animate-pulse" />
        <div className="flex flex-wrap gap-2">
          {[80, 48, 56, 64, 72, 52].map((w, i) => (
            <div
              key={i}
              className="h-7 rounded-full bg-ink-100 animate-pulse"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>

      {/* Grid of 6 card skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-3 w-20 rounded bg-ink-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 rounded bg-ink-100 animate-pulse" />
              <div className="h-6 w-4/5 rounded bg-ink-100 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3.5 rounded bg-ink-100 animate-pulse" />
              <div className="h-3.5 rounded bg-ink-100 animate-pulse" />
              <div className="h-3.5 w-2/3 rounded bg-ink-100 animate-pulse" />
            </div>
            <div className="h-3 w-16 rounded bg-ink-100 animate-pulse" />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
