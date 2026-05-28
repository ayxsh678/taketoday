"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SemanticResult {
  contributionId: string;
  similarity: number;
  title?: string;
  status?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "text-green-700 bg-green-50 border-green-200",
  DRAFT: "text-gray-600 bg-gray-50 border-gray-200",
  UNDER_REVIEW: "text-blue-700 bg-blue-50 border-blue-200",
  FACT_CHECK_PENDING: "text-orange-700 bg-orange-50 border-orange-200",
  VERIFIED: "text-emerald-700 bg-emerald-50 border-emerald-200",
  DISPUTED: "text-red-700 bg-red-50 border-red-200",
  ARCHIVED: "text-gray-500 bg-gray-50 border-gray-200",
};

export default function SemanticSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SemanticResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/search/semantic?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { results?: SemanticResult[]; error?: string };
        if (!res.ok) {
          setError(data.error ?? "Search failed");
          return;
        }
        setResults(data.results ?? []);
        setSearched(true);
      } catch {
        setError("Search failed. Please try again.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24">
      {/* Breadcrumb */}
      <nav className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink/50 mb-8">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span className="mx-2 text-ink/30">/</span>
        <Link href="/contribute" className="hover:text-ink">Contribute</Link>
        <span className="mx-2 text-ink/30">/</span>
        <span className="text-ink">Semantic Search</span>
      </nav>

      <header className="mb-10">
        <h1 className="font-serif text-[42px] leading-none tracking-tight text-ink mb-3">
          Semantic Search
        </h1>
        <p className="text-[15px] text-ink/60 leading-relaxed">
          Find contributions by meaning, not just keywords. Powered by vector embeddings — describe what you&apos;re looking for in natural language.
        </p>
      </header>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-10">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. investigative report on housing affordability in major cities"
            className="flex-1 border border-ink/20 rounded-lg px-4 py-3 text-[15px] text-ink bg-paper placeholder:text-ink/30 focus:outline-none focus:border-ink/50 focus:ring-1 focus:ring-ink/20"
          />
          <button
            type="submit"
            disabled={isPending || !query.trim()}
            className={cn(
              "px-5 py-3 rounded-lg text-[14px] font-medium transition-colors whitespace-nowrap",
              isPending || !query.trim()
                ? "bg-ink/10 text-ink/40 cursor-not-allowed"
                : "bg-ink text-paper hover:bg-ink/90",
            )}
          >
            {isPending ? "Searching…" : "Search"}
          </button>
        </div>
        <p className="mt-2 text-[12px] text-ink/40">
          Uses AI embeddings to find semantically similar contributions — great for finding related investigations, duplicate detection, or topic clusters.
        </p>
      </form>

      {error && (
        <div className="mb-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {searched && (
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink/40 mb-6">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>

          {results.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[15px] text-ink/50">
                No contributions found matching this query. Try rephrasing or lowering the similarity threshold.
              </p>
              <Link
                href="/contribute/new"
                className="inline-block mt-6 text-[13px] font-medium text-ink underline underline-offset-4 hover:text-ink/70"
              >
                Be the first to contribute on this topic →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r) => (
                <Link
                  key={r.contributionId}
                  href={`/contribute/${r.contributionId}`}
                  className="block rounded-xl border border-ink/10 bg-paper p-4 hover:border-ink/25 hover:bg-ink/2 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold text-ink group-hover:underline underline-offset-2 line-clamp-2">
                        {r.title ?? "Untitled Contribution"}
                      </h3>
                      <p className="mt-1 font-mono text-[11px] text-ink/40">
                        ID: {r.contributionId.slice(0, 12)}…
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Similarity bar */}
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-ink/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-ink/60"
                            style={{ width: `${Math.round(r.similarity * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-ink/60 tabular-nums">
                          {Math.round(r.similarity * 100)}%
                        </span>
                      </div>
                      {r.status && (
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded-full border",
                            STATUS_COLORS[r.status] ?? "text-ink/60 bg-ink/5 border-ink/10",
                          )}
                        >
                          {r.status.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state (before search) */}
      {!searched && !isPending && (
        <div className="py-12 text-center border border-dashed border-ink/15 rounded-xl">
          <p className="text-[14px] text-ink/40">Enter a query above to find semantically similar contributions</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[
              "investigative report on corruption",
              "climate change data analysis",
              "tech layoffs 2024",
              "election misinformation",
            ].map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setQuery(ex)}
                className="text-[12px] border border-ink/15 rounded-full px-3 py-1 text-ink/50 hover:border-ink/30 hover:text-ink/70 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
