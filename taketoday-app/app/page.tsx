import { Suspense } from "react";
import { Hero } from "@/components/Hero";
import {
  FeaturedSection,
  FeaturedSectionSkeleton,
} from "@/components/FeaturedSection";
import { FeedSectionSkeleton } from "@/components/FeedSection";
import { PersonalizedFeedSection } from "@/components/PersonalizedFeedSection";
import { IntelligenceStrip } from "@/components/IntelligenceStrip";
import { getAllArticles, getFeaturedArticles } from "@/lib/content/queries";

const FEATURED_ARTICLE_COUNT = 4;

function FeaturedLoader() {
  const featured = getFeaturedArticles(FEATURED_ARTICLE_COUNT);
  const lead = featured[0];
  const side = featured.slice(1);
  if (!lead) return null;
  return <FeaturedSection lead={lead} side={side} />;
}

function FeedLoader({ featuredCount }: { featuredCount: number }) {
  // Fetch all articles server-side; pass to client for personalized ranking.
  const all = getAllArticles();
  const feed = all.slice(featuredCount);
  return <PersonalizedFeedSection articles={feed} />;
}

export default function Home() {
  return (
    <>
      <Hero />
      <Suspense fallback={<FeaturedSectionSkeleton />}>
        <FeaturedLoader />
      </Suspense>
      <Suspense fallback={<FeedSectionSkeleton />}>
        <FeedLoader featuredCount={FEATURED_ARTICLE_COUNT} />
      </Suspense>
      <IntelligenceStrip />
    </>
  );
}
