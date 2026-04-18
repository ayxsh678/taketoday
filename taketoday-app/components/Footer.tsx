import Link from "next/link";
import { Logo } from "@/components/Logo";

/**
 * TakeToday — Global Footer
 * Restraint over completeness. Three columns: identity, sections, company.
 * No social icon blob, no legal blob — just what someone actually might click.
 */

const SECTIONS = [
  { label: "AI", href: "/category/ai" },
  { label: "Finance", href: "/category/finance" },
  { label: "Tech", href: "/category/tech" },
  { label: "Startups", href: "/category/startups" },
  { label: "Briefings", href: "/category/briefings" },
] as const;

const COMPANY = [
  { label: "About", href: "/about" },
  { label: "Subscribe", href: "/subscribe" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-200/70 bg-paper">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Identity */}
        <div className="md:col-span-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-ink"
            aria-label="TakeToday — home"
          >
            <Logo size={22} />
            <span className="font-serif italic text-[22px] leading-none tracking-tight">
              TakeToday
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-ink-500">
            The day&rsquo;s most important stories, cut down to what actually
            matters — and why you should care. No noise. No clickbait.
          </p>
        </div>

        {/* Sections */}
        <div className="md:col-span-3">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400">
            Sections
          </p>
          <ul className="mt-4 space-y-2 text-[14px] text-ink-700">
            {SECTIONS.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="reveal hover:text-ink">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div className="md:col-span-4">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400">
            Company
          </p>
          <ul className="mt-4 space-y-2 text-[14px] text-ink-700">
            {COMPANY.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="reveal hover:text-ink">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ink-200/70">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-[11px] text-ink-500">
          <span>&copy; {year} TakeToday. All rights reserved.</span>
          <span className="tracking-[0.18em] uppercase">News. Simplified.</span>
        </div>
      </div>
    </footer>
  );
}
