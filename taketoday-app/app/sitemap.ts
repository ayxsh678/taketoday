import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/types/article";
import { getAllArticles } from "@/lib/content/queries";
import { SITE, abs } from "@/lib/site";
import { prisma } from "@/lib/db/prisma";
import { ArticleStatus } from "@prisma/client";

// ISR: regenerate sitemap every hour
export const revalidate = 3600;

/**
 * TakeToday — sitemap.xml
 * Combines MDX content articles (contentlayer) with DB-published articles.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const mdxArticles = getAllArticles();

  // Fetch published DB articles (slug + updatedAt)
  let dbArticles: { slug: string; publishedAt: Date | null; updatedAt: Date }[] = [];
  try {
    dbArticles = await prisma.article.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      select: { slug: true, publishedAt: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 1000,
    });
  } catch {
    // DB unavailable at build time — omit DB articles from sitemap
  }

  const newest =
    dbArticles[0]?.publishedAt?.toISOString() ??
    mdxArticles[0]?.publishedAt ??
    new Date().toISOString();

  const home: MetadataRoute.Sitemap[number] = {
    url: SITE.url,
    lastModified: new Date(newest),
    changeFrequency: "hourly",
    priority: 1.0,
  };

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((c) => {
    const lastInCat =
      mdxArticles.find((a) => a.category === c)?.publishedAt ?? newest;
    return {
      url: abs(`/category/${c.toLowerCase()}`),
      lastModified: new Date(lastInCat),
      changeFrequency: "daily",
      priority: 0.8,
    };
  });

  // MDX article entries
  const mdxEntries: MetadataRoute.Sitemap = mdxArticles.map((a) => ({
    url: abs(`/article/${a.slug}`),
    lastModified: new Date(a.updatedAt ?? a.publishedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // DB article entries (deduplicate slugs already in MDX)
  const mdxSlugs = new Set(mdxArticles.map((a) => a.slug));
  const dbEntries: MetadataRoute.Sitemap = dbArticles
    .filter((a) => !mdxSlugs.has(a.slug))
    .map((a) => ({
      url: abs(`/article/${a.slug}`),
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [home, ...categoryEntries, ...mdxEntries, ...dbEntries];
}
