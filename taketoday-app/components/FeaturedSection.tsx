import Link from "next/link";
import { NewsCard } from "@/components/NewsCard";
import type { Article } from "@/types/article";

/**
 * TakeToday — The Lead
 * 7/5 grid at desktop: a single large "lead" story on the left, three
 * stacked inline stories on the right. Mobile stacks everything.
 *
 * Fully data-driven — takes articles as props. The parent route is
 * responsible for picking the lead + side via `getFeaturedArticles`.
 */

export type FeaturedSectionProps = Readonly<{
  lead: Article;
  side: readonly Article[];
}>;

export function FeaturedSection({ lead, side }: FeaturedSectionProps) {
  const m = lead.metadata;
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
            <h3 className="mt-4 font-serif text-[42px] lg:text-[52px] leading-[1.02] tracking-[-0.02em] text-ink group-hover:text-ink-700 transition-colors text-balance">
              {m.title}
            </h3>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-ink-500">
              {lead.content.quickTake}
            </p>
            <time
              dateTime={m.publishedAt}
              className="mt-5 block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400"
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
