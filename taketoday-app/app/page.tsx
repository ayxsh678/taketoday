import { Suspense } from "react";
import { Hero } from "@/components/Hero";
import {
  FeaturedSection,
  FeaturedSectionSkeleton,
} from "@/components/FeaturedSection";
import {
  FeedSection,
  FeedSectionSkeleton,
} from "@/components/FeedSection";
import { IntelligenceStrip } from "@/components/IntelligenceStrip";
import { getAllArticles, getFeaturedArticles } from "@/lib/content/queries";

/**
 * Async server components — own their data fetching so Suspense can stream
 * each section independently. FeaturedSection / FeedSection still take props.
 */
async function FeaturedLoader() {
  const featured = getFeaturedArticles(4);
  const lead = featured[0];
  const side = featured.slice(1);
  if (!lead) return null;
  return <FeaturedSection lead={lead} side={side} />;
}

async function FeedLoader() {
  const all = getAllArticles();
  const featured = getFeaturedArticles(4);
  const feed = all.slice(featured.length);
  return <FeedSection items={feed} />;
}

export default function Home() {
  return (
    <>
      <Hero />
      <Suspense fallback={<FeaturedSectionSkeleton />}>
        <FeaturedLoader />
      </Suspense>
      <Suspense fallback={<FeedSectionSkeleton />}>
        <FeedLoader />
      </Suspense>
      <IntelligenceStrip />
    </>
  );
}
