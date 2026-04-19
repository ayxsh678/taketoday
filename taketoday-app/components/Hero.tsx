import Link from "next/link";

/**
 * TakeToday — Hero
 * A 12-col grid that uses 8 cols for the headline and 4 cols for the meta
 * block on the right. Headline is Inter tight + Instrument Serif italic on
 * the second line. Mono-metadata sits above. CTAs are primary (ink pill)
 * + secondary (ink outline).
 */

export function Hero() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section
      aria-labelledby="hero-headline"
      className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-20 lg:pt-28 pb-20 lg:pb-28"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
        {/* Headline */}
        <div className="lg:col-span-8">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500">
            <span className="text-accent">Issue 001</span>
            <span className="mx-2 text-ink-300" aria-hidden>
              /
            </span>
            {today}
          </p>
          <h1
            id="hero-headline"
            className="mt-8 text-[68px] sm:text-[96px] lg:text-[128px] leading-[0.88] tracking-[-0.04em] text-ink text-balance"
          >
            News.
            <br />
            <span className="font-serif italic tracking-[-0.035em]">
              Simplified.
            </span>
          </h1>
        </div>

        {/* Meta + CTAs */}
        <div className="lg:col-span-4 lg:pb-4">
          <p className="max-w-sm text-[16px] leading-relaxed text-ink-700">
            The day&rsquo;s most important stories, cut down to what actually
            matters — and <em className="font-serif">why you should care</em>.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/today"
              className="inline-flex items-center rounded-full bg-ink text-paper px-5 py-2.5 text-[13px] font-medium tracking-wide hover:bg-ink-700 transition-colors"
            >
              Today&rsquo;s Brief
            </Link>
            <Link
              href="/subscribe"
              className="inline-flex items-center rounded-full border border-ink-300 text-ink px-5 py-2.5 text-[13px] font-medium tracking-wide hover:border-ink hover:bg-ink hover:text-paper transition-colors"
            >
              Subscribe free
            </Link>
          </div>
          <p className="mt-4 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400">
            3-min read · Free forever
          </p>
        </div>
      </div>
    </section>
  );
}
