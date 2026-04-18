import { NewsCard, type NewsCardProps } from "@/components/NewsCard";
import { CATEGORIES, type Category } from "@/types/article";

/**
 * TakeToday — Feed
 * Filter pills (UI only for now) → 1/2/3-col grid of NewsCards → Load more.
 * Server component; no state. The active pill is wired via `?c=` param in
 * Phase 2 once the data layer lands.
 */

type FeedItem = Readonly<Omit<NewsCardProps, "variant">>;

const FEED: readonly FeedItem[] = [
  {
    slug: "apple-ios-ai-rollout",
    title: "Apple\u2019s AI rollout leans on what it already owns \u2014 your device",
    summary:
      "The pitch is privacy as a feature. Most on-device, a narrow set of opt-in cloud calls for the rest.",
    category: "Tech",
    readTime: "3 min read",
    publishedAt: "2026-04-17T16:00:00Z",
  },
  {
    slug: "india-upi-merchant-caps",
    title: "India revisits UPI merchant caps \u2014 payments founders are watching",
    summary:
      "The proposal is modest on paper, seismic for anyone whose unit economics assume zero fees.",
    category: "Finance",
    readTime: "2 min read",
    publishedAt: "2026-04-17T14:30:00Z",
  },
  {
    slug: "anthropic-claude-agents",
    title: "Anthropic ships agents that actually hang up when they\u2019re stuck",
    summary:
      "A small design choice with outsized implications for reliability in long-running workflows.",
    category: "AI",
    readTime: "4 min read",
    publishedAt: "2026-04-17T12:00:00Z",
  },
  {
    slug: "yc-w26-batch-shape",
    title: "YC\u2019s W26 batch is smaller, older, and more technical",
    summary:
      "Partners are quietly telling founders the bar moved. The class composition tells the story.",
    category: "Startups",
    readTime: "3 min read",
    publishedAt: "2026-04-17T10:15:00Z",
  },
  {
    slug: "daily-brief-apr-17",
    title: "Daily Brief \u2014 Thursday, April 17",
    summary:
      "Five things that moved markets, tech, and policy before you finished your coffee.",
    category: "Briefings",
    readTime: "3 min read",
    publishedAt: "2026-04-17T09:00:00Z",
  },
  {
    slug: "eu-ai-act-compliance",
    title: "The EU AI Act\u2019s first compliance deadline is quieter than expected",
    summary:
      "Fewer enforcement actions, more paperwork. Legal teams are calling it \u201cthe documentation tax.\u201d",
    category: "Tech",
    readTime: "4 min read",
    publishedAt: "2026-04-16T17:45:00Z",
  },
];

const FILTERS: readonly (Category | "All")[] = ["All", ...CATEGORIES];

export function FeedSection() {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
        {FEED.map((item) => (
          <NewsCard key={item.slug} {...item} variant="grid" />
        ))}
      </div>

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
