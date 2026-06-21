"use client";

import { useEffect } from "react";

export function TrackPageView({ slug, category: _category }: { slug: string; category: string }) {
  useEffect(() => {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
  }, [slug]);

  return null;
}
