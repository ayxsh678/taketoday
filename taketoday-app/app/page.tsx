import type { Metadata } from "next";
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
import { SITE } from "@/lib/site";

const FEATURED_ARTICLE_COUNT = 4;

const ogImage = `${SITE.url}/api/og?${new URLSearchParams({
  title: "TakeToday",
  deck: SITE.description,
}).toString()}`;

export const metadata: Metadata = {
  openGraph: {
    images: [{ url: ogImage, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    images: [ogImage],
  },
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE.url}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
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
