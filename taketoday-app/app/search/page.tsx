import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NewsCard } from "@/components/NewsCard";
import { SearchPageInput } from "@/components/SearchPageInput";
import { searchArticles } from "@/lib/content/search";
import { SITE } from "@/lib/site";

/**
 * TakeToday — /search
 * Server-rendered results. Query from URL ?q=. Client input updates URL → SSR
 * re-renders with fresh results. No separate API round-trip needed on first load.
 */

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: `Search — ${SITE.name}`,
    description: "Search TakeToday's coverage of AI, finance, tech, and startups.",
    robots: { index: false },
  };
}

async function SearchResults({ q }: { q: string }) {
  if (!q || q.trim().length < 2) {
    return (
      <div className="py-16 text-center">
        <p className="text-[15px] text-ink-500">
          Type at least 2 characters to search.
        </p>
      </div>
    );
  }

  const results = await searchArticles(q.trim(), 20);

  if (results.length === 0) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400">
          No results
        </p>
        <p className="text-[15px] text-ink-500">
          Nothing matched &ldquo;{q}&rdquo;. Try a different term, or browse by section.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {(["AI", "Finance", "Tech", "Startups", "Briefings"] as const).map((cat) => (
            <Link
              key={cat}
              href={`/category/${cat.toLowerCase()}`}
              className="rounded-full border border-ink-200 text-ink-700 px-4 py-1.5 text-[13px] hover:border-ink hover:text-ink transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-10">
        {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{q}&rdquo;
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
        {results.map((item) => (
          <NewsCard
            key={item.slug}
            slug={item.slug}
            title={item.title}
            summary={item.summary}
            category={item.category}
            readTime={item.readTime}
            publishedAt={item.publishedAt}
            variant="grid"
          />
        ))}
      </div>
    </>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  return (
    <div className="mx-auto max-w-site px-6 lg:px-10 pt-16 lg:pt-24 pb-24">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500 mb-8"
      >
        <Link href="/" className="reveal hover:text-ink">Home</Link>
        <span aria-hidden className="mx-2 text-ink-300">/</span>
        <span className="text-ink">Search</span>
      </nav>

      {/* Header */}
      <header className="mb-10 max-w-2xl">
        <h1 className="font-serif text-[48px] lg:text-[64px] leading-none tracking-tighter-2 text-ink">
          <span className="text-ink-400">Find</span>{" "}
          <span className="italic">stories.</span>
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-500">
          Search across AI, finance, tech, startups — every story TakeToday has published.
        </p>
      </header>

      {/* Search input — client component inside Suspense (uses useSearchParams) */}
      <div className="max-w-2xl mb-12">
        <Suspense fallback={
          <div className="w-full border border-ink-200 py-4 px-4 text-[16px] text-ink-400 bg-transparent">
            Loading search…
          </div>
        }>
          <SearchPageInput />
        </Suspense>
      </div>

      {/* Results */}
      <SearchResults q={q} />
    </div>
  );
}
