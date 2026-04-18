import { NewsCard } from "@/components/NewsCard";
import { CATEGORIES, type Article, type Category } from "@/types/article";

/**
 * TakeToday — Feed
 * Filter pills (UI only for now) → 1/2/3-col grid of NewsCards → Load more.
 * Server component; no state. Accepts articles as props so the homepage
 * route owns data access.
 */

export type FeedSectionProps = Readonly<{
  items: readonly Article[];
}>;

const FILTERS: readonly (Category | "All")[] = ["All", ...CATEGORIES];

export function FeedSection({ items }: FeedSectionProps) {
  return (
    <section
      aria-labelledby="feed-heading"
      className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16 border-t border-ink-200/70"
    >
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
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
          {FILTERS.map((f, i) => (
            <button
              key={f}
              role="tab"
              aria-selected={i === 0}
              type="button"
              className={
                i === 0
                  ? "rounded-full bg-ink text-paper px-3.5 py-1.5 text-[12px] font-medium tracking-wide"
                  : "rounded-full border border-ink-200 text-ink-700 px-3.5 py-1.5 text-[12px] hover:border-ink-300 hover:text-ink transition-colors"
              }
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {items.length === 0 ? (
        <p className="text-[14px] text-ink-500">No stories yet. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
          {items.map((a) => (
            <NewsCard
              key={a.metadata.slug}
              slug={a.metadata.slug}
              title={a.metadata.title}
              summary={a.content.quickTake}
              category={a.metadata.category}
              readTime={a.metadata.readTime}
              publishedAt={a.metadata.publishedAt}
              variant="grid"
            />
          ))}
        </div>
      )}

      <div className="mt-14 flex justify-center">
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-ink-300 text-ink px-5 py-2.5 text-[13px] font-medium tracking-wide hover:border-ink hover:bg-ink hover:text-paper transition-colors"
        >
          Load more
        </button>
      </div>
    </section>
  );
}
