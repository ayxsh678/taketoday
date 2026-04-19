"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { FeedItem } from "@/types/article";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  AI: "text-accent",
  Finance: "text-ink-500",
  Tech: "text-ink-500",
  Startups: "text-ink-500",
  Briefings: "text-ink-500",
};

export function SearchPalette({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setQuery("");
      setResults([]);
      setActive(0);
    }
  }, [open]);

  // Debounced search
  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data: FeedItem[] = await res.json();
        setResults(data);
        setActive(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    search(q);
  }

  function navigate(slug: string) {
    onClose();
    router.push(`/article/${slug}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      navigate(results[active].slug);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search articles"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-paper border border-ink-200 shadow-2xl">
        {/* Input row */}
        <div className="flex items-center border-b border-ink-200 px-4">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search articles…"
            className="flex-1 py-4 px-3 bg-transparent text-[15px] text-ink placeholder:text-ink-400 focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && <SpinnerIcon />}
          <kbd className="hidden sm:inline font-mono text-[10px] text-ink-400 border border-ink-200 rounded px-1.5 py-0.5 ml-2">
            esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul role="listbox" className="max-h-[360px] overflow-y-auto">
            {results.map((item, i) => (
              <li
                key={item.slug}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => navigate(item.slug)}
                className={`flex items-start gap-4 px-4 py-3.5 cursor-pointer border-b border-ink-200/50 last:border-0 transition-colors ${
                  i === active ? "bg-ink-100" : "hover:bg-ink-100/60"
                }`}
              >
                <span
                  className={`shrink-0 font-mono text-[9px] tracking-[0.2em] uppercase mt-1 w-16 truncate ${
                    CATEGORY_COLORS[item.category] ?? "text-ink-400"
                  }`}
                >
                  {item.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-ink leading-snug clamp-2">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-500 clamp-1 leading-snug">
                    {item.summary}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-ink-400 mt-0.5">
                  {item.readTime}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center text-[14px] text-ink-400">
            No stories match &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Footer hint */}
        <div className="border-t border-ink-200/70 px-4 py-2 flex items-center gap-4 font-mono text-[10px] text-ink-400">
          <span>
            <kbd className="border border-ink-200 rounded px-1">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="border border-ink-200 rounded px-1">↵</kbd> open
          </span>
          <span>
            <kbd className="border border-ink-200 rounded px-1">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-ink-400 shrink-0"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="text-ink-400 animate-spin shrink-0"
      aria-hidden
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
