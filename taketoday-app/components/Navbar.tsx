"use client";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SearchButton } from "@/components/SearchButton";
import { NavbarControls } from "@/components/NavbarControls";
import { useEffect, useState } from "react";

/**
 * TakeToday — Global Navbar
 * Sticky, ink-on-paper, max-width 1400px.
 * Desktop: logo + category nav + controls + subscribe CTA.
 * Mobile: logo + hamburger → full-screen drawer with categories.
 * Ticker strip shows real article headlines from /api/ticker.
 */

interface Category {
  label: string;
  href: string;
}

interface ApiCategory {
  name: string;
  slug: string;
}

interface TickerItem {
  title: string;
  slug: string;
  category: string;
}

const FALLBACK_CATEGORIES: Category[] = [
  { label: "AI", href: "/category/ai" },
  { label: "Finance", href: "/category/finance" },
  { label: "Tech", href: "/category/tech" },
  { label: "Startups", href: "/category/startups" },
  { label: "Briefings", href: "/category/briefings" },
];

export function Navbar({ showTicker = true }: { showTicker?: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/ticker").then((r) => r.json()),
    ]).then(([catResult, tickerResult]) => {
      if (catResult.status === "fulfilled" && catResult.value?.categories) {
        setCategories(
          catResult.value.categories.map((cat: ApiCategory) => ({
            label: cat.name,
            href: `/category/${cat.slug}`,
          }))
        );
      } else {
        setCategories(FALLBACK_CATEGORIES);
      }
      if (tickerResult.status === "fulfilled" && Array.isArray(tickerResult.value)) {
        setTickerItems(tickerResult.value as TickerItem[]);
      }
    });
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <>
      <header
        className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-ink-200/60"
        aria-label="Primary"
      >
        {/* ── Main bar ─────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-site px-6 lg:px-10 h-16 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-ink hover:text-ink-700 transition-colors shrink-0"
            aria-label="TakeToday — home"
            onClick={() => setMenuOpen(false)}
          >
            <Logo size={22} />
            <span className="font-serif italic text-[22px] leading-none tracking-tight">
              TakeToday
            </span>
          </Link>

          {/* Desktop category nav */}
          <nav
            aria-label="Sections"
            className="hidden lg:flex items-center gap-5 text-[13px] text-ink-700"
          >
            {displayCategories.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="reveal hover:text-ink transition-colors whitespace-nowrap"
              >
                {c.label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-3">
            <NavbarControls />
            <SearchButton />
            <Link
              href="/subscribe"
              className="inline-flex items-center rounded-full bg-ink text-paper px-4 py-1.5 text-[12px] font-medium tracking-wide hover:bg-ink-700 transition-colors"
            >
              Subscribe
            </Link>
          </div>

          {/* Mobile actions: search + hamburger */}
          <div className="flex lg:hidden items-center gap-3">
            <SearchButton />
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="flex flex-col justify-center gap-1.25 w-8 h-8 shrink-0"
            >
              <span
                className={`block h-[1.5px] bg-ink transition-all duration-300 origin-center ${
                  menuOpen ? "rotate-45 translate-y-[6.5px]" : "w-5"
                }`}
              />
              <span
                className={`block h-[1.5px] bg-ink transition-all duration-300 ${
                  menuOpen ? "opacity-0 w-0" : "w-full"
                }`}
              />
              <span
                className={`block h-[1.5px] bg-ink transition-all duration-300 origin-center ${
                  menuOpen ? "-rotate-45 -translate-y-[6.5px]" : "w-3"
                }`}
              />
            </button>
          </div>
        </div>

        {/* ── Ticker ───────────────────────────────────────────────────── */}
        {showTicker && (
          <div className="border-t border-ink-200/60 bg-paper/60 overflow-hidden">
            <div className="mx-auto max-w-site px-6 lg:px-10 h-8 flex items-center gap-4">
              <span className="inline-flex items-center gap-2 shrink-0 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-500">
                <span
                  aria-hidden
                  className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
                />
                Live
              </span>
              <div className="relative flex-1 overflow-hidden">
                {tickerItems.length > 0 ? (
                  <div className="flex gap-12 whitespace-nowrap md:animate-ticker">
                    {[...tickerItems, ...tickerItems].map((item, i) => (
                      <Link
                        key={i}
                        href={`/article/${item.slug}`}
                        className="font-mono text-[11px] text-ink-700 hover:text-ink transition-colors"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <span className="font-mono text-[11px] text-ink-400">
                    Loading latest stories…
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      <div
        aria-hidden={!menuOpen}
        className={`lg:hidden fixed inset-0 z-30 bg-paper transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ top: "var(--navbar-height, 72px)" }}
      >
        <div className="flex flex-col h-full overflow-y-auto px-6 pt-10 pb-24">

          {/* Search link */}
          <Link
            href="/search"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 py-4 border-b border-ink-200/60 text-ink-500 hover:text-ink transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="font-mono text-[12px] tracking-[0.18em] uppercase">Search all stories</span>
          </Link>

          {/* Category links */}
          <nav aria-label="Mobile sections" className="mt-8">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-6">
              Sections
            </p>
            <ul className="space-y-1">
              {displayCategories.map((c) => (
                <li key={c.label}>
                  <Link
                    href={c.href}
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 border-b border-ink-200/60 font-serif text-[28px] tracking-tight text-ink hover:text-ink-700 transition-colors"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Personalisation controls */}
          <div className="mt-10">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-4">
              Preferences
            </p>
            <NavbarControls />
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href="/subscribe"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center rounded-full bg-ink text-paper px-6 py-3 text-[14px] font-medium tracking-wide hover:bg-ink-700 transition-colors"
            >
              Subscribe free
            </Link>
            <p className="mt-3 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400">
              Daily brief · Free forever
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
