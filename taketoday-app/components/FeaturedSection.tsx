import Link from "next/link";
import { NewsCard, type NewsCardProps } from "@/components/NewsCard";

/**
 * TakeToday — The Lead
 * 7/5 grid at desktop: a single large "lead" story on the left, three
 * stacked inline stories on the right. Mobile stacks everything.
 */

type Lead = Readonly<{
  slug: string;
  title: string;
  summary: string;
  category: NewsCardProps["category"];
  readTime: string;
  publishedAt: string;
}>;

const LEAD: Lead = {
  slug: "openai-unveils-new-enterprise-tier",
  title:
    "OpenAI opens a quieter, more expensive door for the enterprises that matter most",
  summary:
    "The company is pitching a tier that swaps the flash for guarantees \u2014 audit trails, data residency, and a direct line to engineering. For finance and healthcare, it\u2019s the first offer that sounds less like a product and more like a contract.",
  category: "AI",
  readTime: "4 min read",
  publishedAt: "2026-04-18T09:00:00Z",
};

const SIDE: readonly Lead[] = [
  {
    slug: "fed-holds-rates-q3-cut-signaled",
    title: "Fed holds rates steady, but the dot-plot is finally moving",
    summary:
      "Powell stopped short of confirming a Q3 cut \u2014 the summary of projections did the talking for him.",
    category: "Finance",
    readTime: "3 min read",
    publishedAt: "2026-04-18T08:00:00Z",
  },
  {
    slug: "nvidia-40b-quarter",
    title: "Nvidia posts a $40B quarter and the AI capex debate gets louder",
    summary:
      "Hyperscaler spending is no longer a line item \u2014 it\u2019s the story. Analysts are now openly asking when it bends.",
    category: "Tech",
    readTime: "3 min read",
    publishedAt: "2026-04-18T07:30:00Z",
  },
  {
    slug: "asia-startup-funding-rebound",
    title: "Startup funding in Asia finds its floor \u2014 and then some",
    summary:
      "Q1 numbers broke an 18-month slide. India and Japan led; China sat it out.",
    category: "Startups",
    readTime: "2 min read",
    publishedAt: "2026-04-18T06:00:00Z",
  },
];

export function FeaturedSection() {
  return (
    <section
      aria-labelledby="lead-heading"
      className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16 border-t border-ink-200/70"
    >
      <header className="flex items-end justify-between mb-10">
        <h2
          id="lead-heading"
          className="font-serif italic text-[32px] lg:text-[40px] tracking-tight text-ink"
        >
          The Lead
        </h2>
        <Link
          href="/today"
          className="reveal font-mono text-[11px] tracking-[0.18em] uppercase text-ink-500 hover:text-ink"
        >
          Today&rsquo;s Brief →
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Lead */}
        <article className="lg:col-span-7 group">
          <Link href={`/article/${LEAD.slug}`} className="block">
            <div className="aspect-[16/10] bg-ink-100 rounded-sm overflow-hidden mb-6">
              <div
                className="w-full h-full"
                style={{
                  background:
                    "radial-gradient(ellipse at 30% 30%, #e5e3dd, #c9c7c1)",
                }}
                aria-hidden
              />
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] uppercase">
              <span className="text-accent">{LEAD.category}</span>
              <span aria-hidden className="text-ink-300">
                /
              </span>
              <span className="text-ink-500">{LEAD.readTime}</span>
            </div>
            <h3 className="mt-4 font-serif text-[42px] lg:text-[52px] leading-[1.02] tracking-[-0.02em] text-ink group-hover:text-ink-700 transition-colors text-balance">
              {LEAD.title}
            </h3>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-ink-500">
              {LEAD.summary}
            </p>
            <time
              dateTime={LEAD.publishedAt}
              className="mt-5 block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400"
            >
              {new Date(LEAD.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </Link>
        </article>

        {/* Side stack */}
        <div className="lg:col-span-5">
          {SIDE.map((s) => (
            <NewsCard key={s.slug} {...s} variant="inline" />
          ))}
        </div>
      </div>
    </section>
  );
}
