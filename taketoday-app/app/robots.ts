import type { MetadataRoute } from "next";
import { SITE, abs } from "@/lib/site";

/**
 * TakeToday — robots.txt
 * Allow all crawlers, point at the sitemap. No private routes to protect yet.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: abs("/sitemap.xml"),
    host: SITE.url,
  };
}
