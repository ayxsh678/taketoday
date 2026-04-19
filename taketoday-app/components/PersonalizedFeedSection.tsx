"use client";

/**
 * TakeToday — PersonalizedFeedSection
 *
 * Renders three distinct feed sections, hydrated from localStorage + cookies:
 *
 *   1. For You     — articles matching user's region (local), ranked by affinity
 *   2. International — GLOBAL articles, ranked by affinity
 *   3. The Feed    — all remaining articles with category filter tabs
 *
 * Server renders skeletons → client hydrates with geo + preference-aware order.
 * No API calls, no loading states.
 */

import type { Article } from "@/types/article";
import { NewsCard } from "@/components/NewsCard";
import { FeedSection } from "@/components/FeedSection";
import { SectionShell } from "@/components/SectionShell";
import { usePersonalization } from "@/hooks/usePersonalization";

interface Props {
  articles: readonly Article[];
}

const COUNTRY_LABELS: Record<string, string> = {
  IN: "India",
  US: "United States",
};

const VISIBLE_ARTICLE_LIMIT = 6;

function ArticleGrid({ items }: { items: readonly Article[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
      {items.slice(0, VISIBLE_ARTICLE_LIMIT).map((a) => (
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
  );
}

export function PersonalizedFeedSection({ articles }: Props) {
  const { localArticles, globalArticles, recommendedArticles, userCountry } =
    usePersonalization(articles);

  const countryLabel = COUNTRY_LABELS[userCountry] ?? userCountry;
  const visibleLocalCount = Math.min(localArticles.length, VISIBLE_ARTICLE_LIMIT);
  const visibleGlobalCount = Math.min(globalArticles.length, VISIBLE_ARTICLE_LIMIT);

  // Articles shown in For You + International sections (avoid duplication in The Feed).
  const featuredSlugs = new Set([
    ...localArticles.slice(0, VISIBLE_ARTICLE_LIMIT).map((a) => a.metadata.slug),
    ...globalArticles.slice(0, VISIBLE_ARTICLE_LIMIT).map((a) => a.metadata.slug),
  ]);
  const remainingArticles = recommendedArticles.filter(
    (a) => !featuredSlugs.has(a.metadata.slug),
  );

  return (
    <>
      {/* For You — local articles */}
      {localArticles.length > 0 && (
        <SectionShell labelledBy="for-you-heading">
          <header className="mb-12 lg:mb-16">
            <h2
              id="for-you-heading"
              className="font-serif italic text-[32px] lg:text-[40px] tracking-tight text-ink"
            >
              For You
            </h2>
            <p className="mt-1 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400">
              {countryLabel} · {visibleLocalCount}{" "}
              {visibleLocalCount === 1 ? "story" : "stories"}
            </p>
          </header>
          <ArticleGrid items={localArticles} />
        </SectionShell>
      )}

      {/* International — GLOBAL articles */}
      {globalArticles.length > 0 && (
        <SectionShell labelledBy="international-heading">
          <header className="mb-12 lg:mb-16">
            <h2
              id="international-heading"
              className="font-serif italic text-[32px] lg:text-[40px] tracking-tight text-ink"
            >
              International
            </h2>
            <p className="mt-1 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400">
              Global · {visibleGlobalCount}{" "}
              {visibleGlobalCount === 1 ? "story" : "stories"}
            </p>
          </header>
          <ArticleGrid items={globalArticles} />
        </SectionShell>
      )}

      {/* The Feed — remaining articles with category filter tabs */}
      <FeedSection items={remainingArticles.length > 0 ? remainingArticles : recommendedArticles} />
    </>
  );
}
