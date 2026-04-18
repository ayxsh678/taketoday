import { Hero } from "@/components/Hero";
import { FeaturedSection } from "@/components/FeaturedSection";
import { FeedSection } from "@/components/FeedSection";
import { IntelligenceStrip } from "@/components/IntelligenceStrip";
import {
  getAllArticles,
  getFeaturedArticles,
} from "@/lib/content/queries";

/**
 * TakeToday — Homepage
 * Hero → The Lead → The Feed → Intelligence Strip.
 * Content comes from MDX files in `content/articles/` via the query layer.
 * Rendering order:
 *   - Lead      = newest article
 *   - Side rail = next 3
 *   - Feed      = every remaining article
 */
export default function Home() {
  const featured = getFeaturedArticles(4);
  const all = getAllArticles();

  const lead = featured[0];
  const side = featured.slice(1);
  // Rest of the feed = everything not already surfaced in The Lead.
  const feed = all.slice(featured.length);

  return (
    <>
      <Hero />
      {lead && <FeaturedSection lead={lead} side={side} />}
      <FeedSection items={feed} />
      <IntelligenceStrip />
    </>
  );
}
