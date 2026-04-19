import Link from "next/link";
import { NewsCard } from "@/components/NewsCard";
import type { Article } from "@/types/article";

export type FeaturedSectionProps = Readonly<{
  lead: Article;
  side: readonly Article[];
}>;

export function FeaturedSection({ lead, side }: FeaturedSectionProps) {
  const m = lead.metadata;
  return (
    <section
      aria-labelledby="lead-heading"
      className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28 border-t border-ink-200/70"
    >
      <header className="flex items-end justify-between mb-12 lg:mb-16">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Lead */}
        <article className="lg:col-span-7 group">
          <Link href={`/article/${m.slug}`} className="block">
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
              <span className="text-accent">{m.category}</span>
              <span aria-hidden className="text-ink-300">
                /
              </span>
              <span className="text-ink-500">{m.readTime}</span>
            </div>
            <h3 className="mt-5 font-serif text-[44px] lg:text-[58px] leading-[1.02] tracking-[-0.02em] text-ink group-hover:text-ink-700 transition-colors text-balance">
              {m.title}
            </h3>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-500">
              {lead.content.quickTake}
            </p>
            <time
              dateTime={m.publishedAt}
              className="mt-6 block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400"
            >
              {new Date(m.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </Link>
        </article>

        {/* Side stack */}
        <div className="lg:col-span-5">
          {side.map((a) => (
            <NewsCard
              key={a.metadata.slug}
              slug={a.metadata.slug}
              title={a.metadata.title}
              summary={a.content.quickTake}
              category={a.metadata.category}
              readTime={a.metadata.readTime}
              publishedAt={a.metadata.publishedAt}
              variant="inline"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedSectionSkeleton() {
  return (
    <section
      aria-hidden
      className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28 border-t border-ink-200/70"
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-12 lg:mb-16">
        <div className="h-9 w-28 rounded bg-ink-100 animate-pulse" />
        <div className="h-3 w-24 rounded bg-ink-100 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Lead skeleton */}
        <div className="lg:col-span-7 space-y-5">
          <div className="aspect-[16/10] rounded-sm bg-ink-100 animate-pulse" />
          <div className="h-3 w-24 rounded bg-ink-100 animate-pulse" />
          <div className="space-y-3">
            <div className="h-12 rounded bg-ink-100 animate-pulse" />
            <div className="h-12 w-5/6 rounded bg-ink-100 animate-pulse" />
            <div className="h-12 w-2/3 rounded bg-ink-100 animate-pulse" />
          </div>
          <div className="space-y-2 pt-1">
            <div className="h-4 rounded bg-ink-100 animate-pulse" />
            <div className="h-4 rounded bg-ink-100 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-ink-100 animate-pulse" />
          </div>
          <div className="h-3 w-20 rounded bg-ink-100 animate-pulse" />
        </div>

        {/* Side stack skeleton — 3 inline cards */}
        <div className="lg:col-span-5 divide-y divide-ink-200/70">
          {[0, 1, 2].map((i) => (
            <div key={i} className="py-6 first:pt-0 space-y-3">
              <div className="h-3 w-20 rounded bg-ink-100 animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 rounded bg-ink-100 animate-pulse" />
                <div className="h-5 w-4/5 rounded bg-ink-100 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 rounded bg-ink-100 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-ink-100 animate-pulse" />
              </div>
              <div className="h-3 w-16 rounded bg-ink-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
