import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/types/article";
import { getAllArticles } from "@/lib/content/queries";
import { SITE, abs } from "@/lib/site";

// ISR: regenerate sitemap every hour
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let articles: Awaited<ReturnType<typeof getAllArticles>> = [];
  try {
    articles = await getAllArticles();
  } catch {
    // DB unavailable at build time — emit minimal sitemap
  }

  const newest = articles[0]?.publishedAt ?? new Date().toISOString();

  const home: MetadataRoute.Sitemap[number] = {
    url: SITE.url,
    lastModified: new Date(newest),
    changeFrequency: "hourly",
    priority: 1.0,
  };

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((c) => {
    const lastInCat = articles.find((a) => a.category === c)?.publishedAt ?? newest;
    return {
      url: abs(`/category/${c.toLowerCase()}`),
      lastModified: new Date(lastInCat),
      changeFrequency: "daily",
      priority: 0.8,
    };
  });

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: abs(`/article/${a.slug}`),
    lastModified: new Date(a.updatedAt ?? a.publishedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [home, ...categoryEntries, ...articleEntries];
}
