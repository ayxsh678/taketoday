import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SearchButton } from "@/components/SearchButton";
import { NavbarControls } from "@/components/NavbarControls";
import { useEffect, useState } from "react";

/**
 * TakeToday — Global Navbar
 * Sticky, ink-on-paper, max-width 1400px. A single backdrop-blur layer sits
 * above the page grain so the nav never fights with the texture underneath.
 * Ticker strip below shows LIVE headlines scrolling at 20s/loop.
 */

export function Navbar({ showTicker = true }: { showTicker?: boolean }) {
  const [categories, setCategories] = useState<Array<{ label: string; href: string }>>([]);

  useEffect(() => {
    // Fetch categories from the public API
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(
            data.categories.map((cat: any) => ({
              label: cat.name,
              href: `/category/${cat.slug}`,
            }))
          );
        }
      })
      .catch((err) => {
        console.error("Failed to fetch categories:", err);
        // Fallback to hardcoded categories if fetch fails
        setCategories([
          { label: "AI", href: "/category/ai" },
          { label: "Finance", href: "/category/finance" },
          { label: "Tech", href: "/category/tech" },
          { label: "Startups", href: "/category/startups" },
          { label: "Briefings", href: "/category/briefings" },
        ]);
      });
  }, []);

  const TICKER_ITEMS: readonly string[] = [
    "Markets close on fresh all-time highs",
    "OpenAI announces new enterprise tier",
    "Fed holds rates, signals cut by Q3",
    "Nvidia revenue tops $40B in quarter",
    "Apple readies AI-first iOS update",
    "Startup funding rebounds in Asia",
  ];

  return (
    <header
      className="sticky top-0 z-40 bg-paper/75 backdrop-blur-md border-b border-ink-200/60"
      aria-label="Primary"
    >
      {/* Main bar */}
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-ink hover:text-ink-700 transition-colors"
          aria-label="TakeToday — home"
        >
          <Logo size={22} />
          <span className="font-serif italic text-[22px] leading-none tracking-tight">
            TakeToday
          </span>
        </Link>

        {/* Categories */}
        <nav
          aria-label="Sections"
          className="flex items-center gap-2 text-[13px] text-ink-700 overflow-x-auto whitespace-nowrap pb-2"
        >
          {categories.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="reveal hover:text-ink transition-colors whitespace-nowrap flex-shrink-0"
            >
              {c.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <NavbarControls />
          <SearchButton />
          <Link
            href="/subscribe"
            className="inline-flex items-center rounded-full bg-ink text-paper px-4 py-1.5 text-[12px] font-medium tracking-wide hover:bg-ink-700 transition-colors"
          >
            Subscribe
          </Link>
        </div>
      </div>

      {/* Ticker */}
      {showTicker && (
        <div className="border-t border-ink-200/60 bg-paper/60 overflow-hidden">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10 h-8 flex items-center gap-4">
            <span className="inline-flex items-center gap-2 shrink-0 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-500">
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
              />
              Live
            </span>
            <div className="relative flex-1">
              <div className="overflow-hidden md:overflow-hidden overflow-x-auto [scroll-behavior:smooth] [&::-webkit-scrollbar]:hide">
                <div className="flex gap-12 whitespace-nowrap md:animate-ticker">
                  {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                    <span
                      key={i}
                      className="font-mono text-[11px] text-ink-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
      })
      .catch((err) => {
        console.error("Failed to fetch categories:", err);
        // Fallback to hardcoded categories if fetch fails
        setCategories([
          { label: "AI", href: "/category/ai" },
          { label: "Finance", href: "/category/finance" },
          { label: "Tech", href: "/category/tech" },
          { label: "Startups", href: "/category/startups" },
          { label: "Briefings", href: "/category/briefings" },
        ]);
      });
  }, []);

const TICKER_ITEMS: readonly string[] = [
  "Markets close on fresh all-time highs",
  "OpenAI announces new enterprise tier",
  "Fed holds rates, signals cut by Q3",
  "Nvidia revenue tops $40B in quarter",
  "Apple readies AI-first iOS update",
  "Startup funding rebounds in Asia",
];

export function Navbar({ showTicker = true }: { showTicker?: boolean }) {
  return (
    <header
      className="sticky top-0 z-40 bg-paper/75 backdrop-blur-md border-b border-ink-200/60"
      aria-label="Primary"
    >
      {/* Main bar */}
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-ink hover:text-ink-700 transition-colors"
          aria-label="TakeToday — home"
        >
          <Logo size={22} />
          <span className="font-serif italic text-[22px] leading-none tracking-tight">
            TakeToday
          </span>
        </Link>

        {/* Categories */}
        <nav
          aria-label="Sections"
          className="flex items-center gap-2 text-[13px] text-ink-700 overflow-x-auto whitespace-nowrap pb-2"
        >
          {CATEGORIES.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="reveal hover:text-ink transition-colors whitespace-nowrap flex-shrink-0"
            >
              {c.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <NavbarControls />
          <SearchButton />
          <Link
            href="/subscribe"
            className="inline-flex items-center rounded-full bg-ink text-paper px-4 py-1.5 text-[12px] font-medium tracking-wide hover:bg-ink-700 transition-colors"
          >
            Subscribe
          </Link>
        </div>
      </div>

      {/* Ticker */}
      {showTicker && (
        <div className="border-t border-ink-200/60 bg-paper/60 overflow-hidden">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10 h-8 flex items-center gap-4">
            <span className="inline-flex items-center gap-2 shrink-0 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-500">
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
              />
              Live
            </span>
            <div className="relative flex-1 overflow-hidden">
              <div className="flex gap-12 animate-ticker whitespace-nowrap">
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                  <span
                    key={i}
                    className="font-mono text-[11px] text-ink-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
