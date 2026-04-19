import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/types/article";
import { getAllArticles } from "@/lib/content/queries";
import { SITE, abs } from "@/lib/site";

/**
 * TakeToday — sitemap.xml
 * Next.js 15 file convention; emits one entry per static route:
 *   /
 *   /category/{ai,finance,tech,startups,briefings}
 *   /article/{slug}  (one per MDX file)
 *
 * `lastModified` is `updatedAt ?? publishedAt` for articles so Google sees
 * a real change signal when content is revised. Homepage and category pages
 * inherit the newest article date.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();

  // Newest article date — used as a proxy "last touched" for aggregate pages.
  const newest = articles[0]?.metadata.publishedAt ?? new Date().toISOString();

  const home: MetadataRoute.Sitemap[number] = {
    url: SITE.url,
    lastModified: new Date(newest),
    changeFrequency: "hourly",
    priority: 1.0,
  };

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((c) => {
    const lastInCat =
      articles.find((a) => a.metadata.category === c)?.metadata.publishedAt ??
      newest;
    return {
      url: abs(`/category/${c.toLowerCase()}`),
      lastModified: new Date(lastInCat),
      changeFrequency: "daily",
      priority: 0.8,
    };
  });

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: abs(`/article/${a.metadata.slug}`),
    lastModified: new Date(a.metadata.updatedAt ?? a.metadata.publishedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [home, ...categoryEntries, ...articleEntries];
}
