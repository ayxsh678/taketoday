import { Hero } from "@/components/Hero";
import { FeaturedSection } from "@/components/FeaturedSection";
import { FeedSection } from "@/components/FeedSection";
import { IntelligenceStrip } from "@/components/IntelligenceStrip";

/**
 * TakeToday — Homepage
 * Hero → The Lead → The Feed → Intelligence Strip.
 * The Intelligence Strip is intentionally full-bleed; the other sections
 * stay within the 1400px reading column. Layout.tsx wraps everything in
 * `<main>` so we don't repeat that here.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedSection />
      <FeedSection />
      <IntelligenceStrip />
    </>
  );
}
