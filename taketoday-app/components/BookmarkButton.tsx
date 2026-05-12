"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function BookmarkButton({ slug }: { slug: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bookmarked, setBookmarked] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`/api/bookmarks?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => setBookmarked(d.bookmarked ?? false))
      .catch(() => setBookmarked(false));
  }, [slug, status]);

  async function handleToggle() {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/article/${slug}`);
      return;
    }
    if (loading || bookmarked === null) return;

    setLoading(true);
    const optimistic = !bookmarked;
    setBookmarked(optimistic);

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      setBookmarked(data.bookmarked);
    } catch {
      setBookmarked(!optimistic);
    } finally {
      setLoading(false);
    }
  }

  const filled = bookmarked === true;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={filled ? "Remove bookmark" : "Bookmark this article"}
      aria-pressed={filled}
      className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-500 hover:text-ink transition-colors disabled:opacity-40"
    >
      <BookmarkIcon filled={filled} />
      {filled ? "Saved" : "Save"}
    </button>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="16"
      viewBox="0 0 14 16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 1h12v14L7 11 1 15V1z" />
    </svg>
  );
}
