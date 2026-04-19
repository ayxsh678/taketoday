"use client";

import { useEffect, useState } from "react";
import { SearchPalette } from "@/components/SearchPalette";

export function SearchButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="hidden sm:inline-flex items-center gap-2 rounded-full border border-ink-200 px-3.5 py-1.5 text-[12px] text-ink-500 hover:text-ink hover:border-ink-300 transition-colors"
      >
        <SearchIcon />
        <span>Search</span>
        <kbd className="font-mono text-[10px] text-ink-400 border border-ink-200 rounded px-1">
          ⌘K
        </kbd>
      </button>

      <SearchPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
