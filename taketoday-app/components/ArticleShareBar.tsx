"use client";

/**
 * TakeToday — ArticleShareBar
 * Inline share controls: copy link + Twitter/X.
 * Appears below the article header meta row.
 */

import { useState } from "react";

interface Props {
  title: string;
  url: string;
}

export function ArticleShareBar({ title, url }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — select + copy via execCommand (legacy browsers)
      const el = document.createElement("input");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const twitterHref = `https://twitter.com/intent/tweet?${new URLSearchParams({
    text: title,
    url,
    via: "TakeTodayHQ",
  }).toString()}`;

  return (
    <div className="flex items-center gap-3 mt-8">
      <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400 shrink-0">
        Share
      </span>

      {/* Twitter/X */}
      <a
        href={twitterHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X (Twitter)"
        className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3.5 py-1.5 text-[12px] text-ink-700 hover:border-ink hover:text-ink transition-colors"
      >
        <XIcon />
        <span>Post</span>
      </a>

      {/* Copy link */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy article link"
        className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3.5 py-1.5 text-[12px] text-ink-700 hover:border-ink hover:text-ink transition-colors"
      >
        {copied ? <CheckIcon /> : <LinkIcon />}
        <span>{copied ? "Copied!" : "Copy link"}</span>
      </button>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.74-8.851L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
