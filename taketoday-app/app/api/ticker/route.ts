import { NextResponse } from "next/server";
import { getAllArticles } from "@/lib/content/queries";

/**
 * GET /api/ticker
 * Returns the 8 most recent article titles + slugs for the navbar ticker.
 * Static at build; revalidates every hour via ISR.
 */

export const revalidate = 3600;

export function GET() {
  const articles = getAllArticles().slice(0, 8);
  const items = articles.map((a) => ({
    title: a.title,
    slug: a.slug,
    category: a.category,
  }));
  return NextResponse.json(items);
}
