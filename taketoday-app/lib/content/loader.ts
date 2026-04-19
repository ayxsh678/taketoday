import "server-only";
import type { Article } from "@/types/article";
import { articleSchema } from "@/lib/content/schema";

/**
 * TakeToday — Contentlayer-backed MDX loader
 *
 * Contentlayer watches `content/articles/` and generates fully-typed
 * document data in `.contentlayer/generated/` at build time / dev time.
 * This loader adapts that generated data to our `Article` type, keeping the
 * public query surface (`lib/content/queries.ts`) completely unchanged.
 *
 * If the import below fails, run: npx contentlayer2 build
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — path resolved via tsconfig "contentlayer/generated" alias
import { allArticles as clArticles } from "contentlayer/generated";

let cache: readonly Article[] | null = null;

/** Lazy-load and validate all articles from Contentlayer's generated data. */
export function loadAllArticles(): readonly Article[] {
  if (cache) return cache;

  const articles: Article[] = (clArticles as CLArticle[]).map(adapt);

  // Preserve newest-first ordering downstream callers rely on.
  articles.sort(
    (a, b) =>
      new Date(b.metadata.publishedAt).getTime() -
      new Date(a.metadata.publishedAt).getTime(),
  );

  cache = Object.freeze(articles);
  return cache;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

/**
 * Minimal shape of what Contentlayer emits for an Article document.
 * We use a local interface rather than importing the generated type directly
 * so the loader compiles even before the first `contentlayer2 build` run.
 */
interface CLArticle {
  slug: string;
  title: string;
  deck: string;
  category: string;
  format: string;
  region: string;
  publishedAt: string;
  updatedAt?: string;
  author: { name: string; type: string };
  quickTake: string;
  whyItMatters: string;
  takeaways: string[];
  readTime: string; // computed field
  body: { raw: string };
}

function adapt(cl: CLArticle): Article {
  // Runtime enforcement of the 3-item tuple Contentlayer can't express.
  if (!Array.isArray(cl.takeaways) || cl.takeaways.length !== 3) {
    throw new Error(
      `Article "${cl.slug}" must have exactly 3 takeaways (got ${cl.takeaways?.length ?? 0}).`,
    );
  }

  const article: Article = {
    metadata: {
      slug: cl.slug,
      title: cl.title,
      deck: cl.deck,
      category: cl.category as Article["metadata"]["category"],
      format: cl.format as Article["metadata"]["format"],
      region: cl.region as Article["metadata"]["region"],
      readTime: cl.readTime,
      publishedAt: cl.publishedAt,
      updatedAt: cl.updatedAt,
      author: {
        name: cl.author.name,
        type: cl.author.type as "Organization" | "Person",
      },
    },
    content: {
      body: cl.body.raw,
      quickTake: cl.quickTake,
      whyItMatters: cl.whyItMatters,
      takeaways: cl.takeaways as [string, string, string],
    },
  };

  const validated = articleSchema.safeParse(article);
  if (!validated.success) {
    throw new Error(
      `Contentlayer article "${cl.slug}" failed Zod validation: ${validated.error.message}`,
    );
  }

  return validated.data as Article;
}
