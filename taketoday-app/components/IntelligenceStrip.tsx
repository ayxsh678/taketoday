import { NewsletterInlineForm } from "@/components/NewsletterInlineForm";

/**
 * TakeToday — Intelligence Strip
 * Full-bleed, ink-black. Newsletter CTA wired to POST /api/subscribe.
 */

export function IntelligenceStrip() {
  return (
    <section
      aria-labelledby="strip-heading"
      className="bg-ink text-paper"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400">
            The Daily Brief
          </p>
          <h2
            id="strip-heading"
            className="mt-4 font-serif text-[44px] lg:text-[64px] leading-[1.02] tracking-[-0.02em] text-paper text-balance"
          >
            Five stories.
            <br />
            <span className="italic">One smart minute.</span>
          </h2>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-300">
            Every weekday at 7am. The day&rsquo;s most important moves in AI,
            finance, tech, and startups &mdash; cut down to what actually matters.
          </p>
        </div>

        <div className="lg:col-span-5">
          <NewsletterInlineForm />
        </div>
      </div>
    </section>
  );
}
