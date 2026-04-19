import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `About — ${SITE.name}`,
  description:
    "TakeToday exists because most news is designed to keep you reading, not to help you understand. We fix that.",
  alternates: { canonical: `${SITE.url}/about` },
  openGraph: {
    title: `About — ${SITE.name}`,
    description: "What TakeToday is and why it exists.",
    type: "website",
    siteName: SITE.name,
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-16 lg:pt-24 pb-24">
      <nav
        aria-label="Breadcrumb"
        className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500"
      >
        <Link href="/" className="reveal hover:text-ink">
          Home
        </Link>
        <span aria-hidden className="mx-2 text-ink-300">
          /
        </span>
        <span className="text-ink">About</span>
      </nav>

      <header className="mt-8 max-w-3xl">
        <h1 className="font-serif text-[56px] lg:text-[80px] leading-[1.0] tracking-[-0.03em] text-ink">
          <span className="text-ink-400">News.</span>
          <br />
          <span className="italic">Simplified.</span>
        </h1>
        <p className="mt-6 text-[18px] leading-relaxed text-ink-500 max-w-[60ch]">
          Most news is designed to keep you scrolling. TakeToday is designed to
          help you understand — then get on with your day.
        </p>
      </header>

      <div className="mt-16 border-t border-ink-200/70 pt-14 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-7 space-y-10 text-[16px] leading-relaxed text-ink-700">
          <section>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-4">
              The problem
            </p>
            <p>
              Attention is the business model of modern media. Outrage, anxiety,
              and endless scroll keep readers on-site — advertisers pay per
              minute. The incentive to inform you competes directly with the
              incentive to trap you.
            </p>
            <p className="mt-4">
              TakeToday opts out of that model. We&rsquo;re not trying to
              maximize your time on site. We&rsquo;re trying to minimize it,
              while still leaving you genuinely better informed.
            </p>
          </section>

          <section>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-4">
              What we do
            </p>
            <p>
              Every article follows the same structure: a quick take (what
              happened, in one sentence), why it matters (what it means for you
              or your industry), and three sharp takeaways. That&rsquo;s it.
            </p>
            <p className="mt-4">
              We cover AI, finance, tech, and startups — the four areas where a
              week of slow reading is the difference between being ahead of
              something and reacting to it.
            </p>
          </section>

          <section>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-4">
              Who we are
            </p>
            <p>
              TakeToday is an independent publication. No parent company, no
              venture capital, no native advertising masquerading as editorial.
              Subscriptions are the only revenue model we&rsquo;re building
              toward — readers pay, readers are the customer.
            </p>
          </section>
        </div>

        <aside className="lg:col-span-4 lg:col-start-9 space-y-8">
          <div className="border border-ink-200/70 p-8">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-5">
              In numbers
            </p>
            <dl className="space-y-5">
              {[
                { stat: "≤ 4 min", label: "Average read time" },
                { stat: "5", label: "Coverage verticals" },
                { stat: "3", label: "Takeaways per story" },
                { stat: "0", label: "Ads. Ever." },
              ].map(({ stat, label }) => (
                <div key={label}>
                  <dt className="font-serif italic text-[40px] leading-none tracking-[-0.02em] text-ink">
                    {stat}
                  </dt>
                  <dd className="mt-1 text-[13px] text-ink-500">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="border border-ink-200/70 p-8">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-4">
              Read the coverage
            </p>
            <ul className="space-y-2 text-[14px] text-ink-700">
              {[
                { label: "AI", href: "/category/ai" },
                { label: "Finance", href: "/category/finance" },
                { label: "Tech", href: "/category/tech" },
                { label: "Startups", href: "/category/startups" },
                { label: "Briefings", href: "/category/briefings" },
              ].map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className="reveal hover:text-ink">
                    {c.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
