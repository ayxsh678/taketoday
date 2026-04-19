import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Contact — ${SITE.name}`,
  description:
    "Tips, corrections, pitches, or just want to say hello — here's how to reach the TakeToday newsroom.",
  alternates: { canonical: `${SITE.url}/contact` },
  openGraph: {
    title: `Contact — ${SITE.name}`,
    description: "Reach the TakeToday newsroom.",
    type: "website",
    siteName: SITE.name,
  },
};

const CONTACT_ITEMS = [
  {
    label: "Tips & story leads",
    desc: "Got a scoop, a data point, or a lead we should follow? We read everything.",
    address: "tips@taketoday.com",
  },
  {
    label: "Corrections",
    desc: "We got something wrong? Tell us and we'll fix it publicly.",
    address: "corrections@taketoday.com",
  },
  {
    label: "Pitches",
    desc: "Want to contribute a piece? Send a two-sentence pitch and a relevant sample.",
    address: "pitch@taketoday.com",
  },
] as const;

export default function ContactPage() {
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
        <span className="text-ink">Contact</span>
      </nav>

      <header className="mt-8 max-w-2xl">
        <h1 className="font-serif text-[56px] lg:text-[80px] leading-[1.0] tracking-[-0.03em] text-ink">
          <span className="italic">Get in touch.</span>
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-ink-500">
          Tips, corrections, pitches, or just a note — the newsroom reads every
          email, even if we can&rsquo;t reply to all of them.
        </p>
      </header>

      <div className="mt-16 border-t border-ink-200/70 pt-14 grid grid-cols-1 md:grid-cols-3 gap-px bg-ink-200/40">
        {CONTACT_ITEMS.map(({ label, desc, address }) => (
          <div key={label} className="bg-paper p-8 lg:p-10">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-4">
              {label}
            </p>
            <p className="text-[15px] leading-relaxed text-ink-600 mb-6">
              {desc}
            </p>
            <a
              href={`mailto:${address}`}
              className="text-[14px] text-ink underline underline-offset-4 hover:text-ink-600 transition-colors"
            >
              {address}
            </a>
          </div>
        ))}
      </div>

      <div className="mt-12 border border-ink-200/70 p-8 max-w-2xl">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-4">
          Response times
        </p>
        <p className="text-[15px] leading-relaxed text-ink-600">
          We aim to respond to tips and corrections within 24 hours on weekdays.
          Pitches typically get a reply within a week — if you haven&rsquo;t
          heard back in ten days, feel free to follow up once.
        </p>
      </div>
    </div>
  );
}
