import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const revalidate = 300; // 5 min cache

export async function GET() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 10,
    select: {
      slug: true,
      headline: true,
      category: { select: { name: true } },
    },
  });

  const items = articles.map((a) => ({
    title: a.headline,
    slug: a.slug,
    category: a.category?.name ?? "News",
  }));

  return NextResponse.json(items, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
