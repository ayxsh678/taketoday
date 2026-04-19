import { NextRequest, NextResponse } from "next/server";
import { getAllArticles } from "@/lib/content/queries";
import type { FeedItem } from "@/types/article";

export const dynamic = "force-dynamic";

function score(article: ReturnType<typeof getAllArticles>[number], q: string): number {
  const lq = q.toLowerCase();
  const { title, deck, category } = article.metadata;
  const { quickTake, whyItMatters } = article.content;

  let s = 0;
  if (title.toLowerCase().includes(lq)) s += 10;
  if (deck.toLowerCase().includes(lq)) s += 6;
  if (quickTake.toLowerCase().includes(lq)) s += 4;
  if (category.toLowerCase().includes(lq)) s += 3;
  if (whyItMatters.toLowerCase().includes(lq)) s += 2;
  return s;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json([] as FeedItem[]);
  }

  const articles = getAllArticles();
  const results: FeedItem[] = articles
    .map((a) => ({ article: a, s: score(a, q) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map(({ article: a }) => ({
      slug: a.metadata.slug,
      title: a.metadata.title,
      summary: a.content.quickTake,
      category: a.metadata.category,
      readTime: a.metadata.readTime,
      publishedAt: a.metadata.publishedAt,
    }));

  return NextResponse.json(results);
}
