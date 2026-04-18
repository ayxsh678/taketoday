/**
 * TakeToday — Intelligence Strip
 * Full-bleed, ink-black, one idea: trade your email for clarity.
 * Rendered as a server component. The form is non-functional until we
 * wire the newsletter endpoint in Phase 3.
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

        <form
          className="lg:col-span-5"
          aria-label="Subscribe to the Daily Brief"
        >
          <div className="flex items-center gap-2 bg-ink-700 rounded-full p-1 pl-5 ring-1 ring-ink-700/60 focus-within:ring-paper/30 transition">
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@domain.com"
              className="flex-1 bg-transparent border-0 outline-none text-paper placeholder:text-ink-400 text-[14px] py-3"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-paper text-ink px-5 py-2.5 text-[13px] font-medium tracking-wide hover:bg-ink-100 transition-colors"
            >
              Subscribe free
            </button>
          </div>
          <p className="mt-4 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400">
            No spam. Unsubscribe anytime.
          </p>
        </form>
      </div>
    </section>
  );
}
