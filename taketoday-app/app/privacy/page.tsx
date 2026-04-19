import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE.name}`,
  description:
    "TakeToday's privacy policy: what we collect, why, and what we don't do with it.",
  alternates: { canonical: `${SITE.url}/privacy` },
  openGraph: {
    title: `Privacy Policy — ${SITE.name}`,
    description: "What TakeToday collects and how it's used.",
    type: "website",
    siteName: SITE.name,
  },
};

const SECTIONS = [
  {
    heading: "What we collect",
    body: `When you subscribe, we collect your email address and, optionally, your first name. That's the full extent of personal information we request. If you visit the site without subscribing, standard server logs may capture your IP address and browser type — the same data every web server on the internet sees. We don't layer analytics on top of that beyond what our hosting provider captures.`,
  },
  {
    heading: "What we do with it",
    body: `Your email is used to send you TakeToday. Nothing else. We do not sell subscriber lists. We do not share your address with advertisers. We do not use it for retargeting. If we ever partner with a third-party email delivery provider, they receive your address for delivery purposes only and are contractually prohibited from using it for any other purpose.`,
  },
  {
    heading: "Cookies",
    body: `TakeToday does not set advertising or tracking cookies. We may set a minimal session cookie to support site functionality (e.g. form submission state). We do not use third-party tracking pixels, ad networks, or behavioural analytics tools.`,
  },
  {
    heading: "Your rights",
    body: `You can unsubscribe at any time using the link in any email we send — no login required, one click. If you want your data deleted from our records entirely, email us at privacy@taketoday.com and we'll action it within 30 days.`,
  },
  {
    heading: "Changes to this policy",
    body: `If we materially change how we handle your data, we'll notify subscribers via email before the change takes effect. Minor editorial updates won't trigger an email, but the date below will change.`,
  },
] as const;

export default function PrivacyPage() {
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
        <span className="text-ink">Privacy</span>
      </nav>

      <header className="mt-8 max-w-2xl">
        <h1 className="font-serif text-[56px] lg:text-[72px] leading-[1.0] tracking-[-0.03em] text-ink">
          Privacy
          <br />
          <span className="italic">Policy.</span>
        </h1>
        <p className="mt-5 font-mono text-[11px] tracking-[0.18em] uppercase text-ink-400">
          Last updated — April 2025
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-500 max-w-[60ch]">
          Short version: we collect your email to send you TakeToday. We
          don&rsquo;t sell it, share it, or do anything weird with it.
        </p>
      </header>

      <div className="mt-16 border-t border-ink-200/70 pt-14 max-w-3xl space-y-12">
        {SECTIONS.map(({ heading, body }) => (
          <section key={heading}>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-4">
              {heading}
            </p>
            <p className="text-[16px] leading-relaxed text-ink-700">{body}</p>
          </section>
        ))}

        <section>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-4">
            Contact
          </p>
          <p className="text-[16px] leading-relaxed text-ink-700">
            Privacy questions go to{" "}
            <a
              href="mailto:privacy@taketoday.com"
              className="underline underline-offset-4 hover:text-ink transition-colors"
            >
              privacy@taketoday.com
            </a>
            . For general enquiries, see our{" "}
            <Link
              href="/contact"
              className="underline underline-offset-4 hover:text-ink transition-colors"
            >
              contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
