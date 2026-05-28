"use client";

/**
 * TakeToday — SearchPageInput
 * Controlled input on /search. Debounces URL push so SSR re-fetches results.
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchPageInput() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync if URL changes externally (e.g. back/forward)
  useEffect(() => {
    setValue(params.get("q") ?? "");
  }, [params]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setValue(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const url = q.trim().length >= 2 ? `/search?q=${encodeURIComponent(q.trim())}` : "/search";
      router.replace(url, { scroll: false });
    }, 250);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const url = value.trim().length >= 2
      ? `/search?q=${encodeURIComponent(value.trim())}`
      : "/search";
    router.push(url);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative">
      <label htmlFor="search-q" className="sr-only">
        Search articles
      </label>

      {/* Search icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink-400" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <input
        id="search-q"
        type="search"
        name="q"
        value={value}
        onChange={handleChange}
        autoComplete="off"
        spellCheck={false}
        autoFocus
        placeholder="Search articles, topics, categories…"
        className="w-full border border-ink-200 bg-transparent pl-11 pr-4 py-4 text-[16px] text-ink placeholder:text-ink-400 focus:outline-none focus:border-ink transition-colors"
      />

      <button type="submit" className="sr-only">Search</button>
    </form>
  );
}
