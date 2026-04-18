import "server-only";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { Article } from "@/types/article";
import {
  articleFrontmatterSchema,
  articleSchema,
} from "@/lib/content/schema";

/**
 * TakeToday — MDX loader
 * Reads every .mdx file in `content/articles/`, parses the frontmatter,
 * validates it against the schema, computes readTime from the body, and
 * returns a fully typed Article.
 *
 * Runs at build time only — the `server-only` import ensures this module
 * cannot accidentally ship to the client.
 *
 * The read happens once per build. Node's require cache keeps the result
 * alive across route calls, so no manual memoization is needed beyond the
 * module-level `cache` variable used here as an explicit guard.
 */

const CONTENT_DIR = join(process.cwd(), "content", "articles");

let cache: readonly Article[] | null = null;

/** Lazy-load all articles. Throws if any file fails validation. */
export function loadAllArticles(): readonly Article[] {
  if (cache) return cache;

  const files = safeReadDir(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

  const articles: Article[] = files.map((filename) => {
    const full = join(CONTENT_DIR, filename);
    const raw = readFileSync(full, "utf8");
    const { data: frontmatter, content: body } = matter(raw);

    const parsed = articleFrontmatterSchema.safeParse(frontmatter);
    if (!parsed.success) {
      throw new Error(
        `Invalid frontmatter in ${filename}: ${parsed.error.message}`
      );
    }
    const fm = parsed.data;

    const rt = readingTime(body);
    const article: Article = {
      metadata: {
        slug: fm.slug,
        title: fm.title,
        deck: fm.deck,
        category: fm.category,
        format: fm.format,
        readTime: formatReadTime(rt.minutes),
        publishedAt: fm.publishedAt,
        updatedAt: fm.updatedAt,
        author: fm.author,
      },
      content: {
        body,
        quickTake: fm.quickTake,
        whyItMatters: fm.whyItMatters,
        takeaways: fm.takeaways,
      },
    };

    const validated = articleSchema.safeParse(article);
    if (!validated.success) {
      throw new Error(
        `Enriched article failed validation in ${filename}: ${validated.error.message}`
      );
    }
    return validated.data as Article;
  });

  // Sort newest-first at load time so every downstream query can rely on it.
  articles.sort(
    (a, b) =>
      new Date(b.metadata.publishedAt).getTime() -
      new Date(a.metadata.publishedAt).getTime()
  );

  cache = Object.freeze(articles);
  return cache;
}

function safeReadDir(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

/** `reading-time` returns fractional minutes; we round up and format. */
function formatReadTime(minutes: number): string {
  const m = Math.max(1, Math.ceil(minutes));
  return `${m} min read`;
}
