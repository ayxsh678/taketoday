import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Subscribe — ${SITE.name}`,
  description:
    "Get TakeToday's sharpest stories delivered to your inbox. No noise, no spam — just the stories that matter, simplified.",
  alternates: { canonical: `${SITE.url}/subscribe` },
  openGraph: {
    title: `Subscribe — ${SITE.name}`,
    description: "Sharp news, in your inbox. Free to start.",
    type: "website",
    siteName: SITE.name,
  },
};

export default function SubscribePage() {
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
        <span className="text-ink">Subscribe</span>
      </nav>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        <div className="lg:col-span-6">
          <header className="max-w-xl">
            <h1 className="font-serif text-[56px] lg:text-[72px] leading-[1.0] tracking-[-0.03em] text-ink">
              The brief,
              <br />
              <span className="italic">in your inbox.</span>
            </h1>
            <p className="mt-6 text-[17px] leading-relaxed text-ink-500">
              Every weekday — the stories that matter in AI, finance, tech, and
              startups. Stripped of noise. Ready in four minutes or less.
            </p>
          </header>

          <ul className="mt-10 space-y-4">
            {[
              "Quick takes on the day's biggest moves",
              "Three sharp takeaways per story",
              "No ads, no sponsored content, no padding",
              "Unsubscribe in one click, any time",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-[15px] text-ink-700"
              >
                <span
                  aria-hidden
                  className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-accent"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <div className="border border-ink-200/70 p-8 lg:p-10">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-6">
              Get started — it&rsquo;s free
            </p>

            <form
              action="#"
              method="POST"
              className="space-y-4"
              aria-label="Subscribe form"
            >
              <div>
                <label
                  htmlFor="sub-name"
                  className="block text-[13px] text-ink-600 mb-1.5"
                >
                  First name
                </label>
                <input
                  id="sub-name"
                  name="name"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Alex"
                  className="w-full border border-ink-200 bg-transparent px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-400 focus:outline-none focus:border-ink transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="sub-email"
                  className="block text-[13px] text-ink-600 mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="sub-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="w-full border border-ink-200 bg-transparent px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-400 focus:outline-none focus:border-ink transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-ink text-paper py-3 text-[13px] font-medium tracking-wide hover:bg-ink-700 transition-colors"
              >
                Subscribe — free
              </button>
            </form>

            <p className="mt-5 text-[12px] text-ink-400 leading-relaxed">
              By subscribing you agree to our{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-ink transition-colors">
                privacy policy
              </Link>
              . No spam, ever. One-click unsubscribe.
            </p>
          </div>

          <div className="mt-6 border border-ink-200/70 p-6">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-4">
              Or follow via RSS
            </p>
            <p className="text-[14px] text-ink-600 leading-relaxed">
              Prefer a feed reader?{" "}
              <Link
                href="/feed.xml"
                className="text-ink underline underline-offset-2 hover:text-ink-700 transition-colors"
              >
                Subscribe via RSS
              </Link>{" "}
              — works with Feedly, Reeder, NetNewsWire, and any standard reader.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
