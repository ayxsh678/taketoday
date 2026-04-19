import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { EnrichmentResult } from "./enrichArticle";

// ─── Slug validation ──────────────────────────────────────────────────────────

/** Whitelist pattern — rejects path separators, dots, and any non-slug chars. */
const SLUG_RE = /^[a-z0-9-]+$/;

/**
 * Throws a descriptive error if `slug` contains path-traversal sequences or
 * characters outside the allowed `[a-z0-9-]` set.
 */
export function validateSlug(slug: string): void {
  if (!SLUG_RE.test(slug)) {
    throw new Error(
      `Invalid slug "${slug}": only lowercase letters, digits, and hyphens are allowed.`,
    );
  }
}

// ─── Path helper ──────────────────────────────────────────────────────────────

/**
 * Resolves the absolute path to an article file.
 * Validates the slug first — will throw before any filesystem access if the
 * slug contains `..`, `/`, `\`, or any other disallowed character.
 */
export function resolveArticlePath(slug: string): string {
  validateSlug(slug);
  return path.join(process.cwd(), "content", "articles", `${slug}.mdx`);
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export interface RawArticleFile {
  frontmatter: Record<string, unknown>;
  body: string;
  articlePath: string;
}

/**
 * Reads and parses an MDX article by slug.
 * Validates the slug, resolves the path, reads with `fs.promises`, and splits
 * frontmatter from body via gray-matter.
 *
 * Throws if the slug is invalid or the file does not exist.
 */
export async function readRawArticle(slug: string): Promise<RawArticleFile> {
  const articlePath = resolveArticlePath(slug); // throws on bad slug

  let raw: string;
  try {
    raw = await fs.readFile(articlePath, "utf8");
  } catch {
    throw new Error(`Article not found: ${slug}`);
  }

  const { data: frontmatter, content: body } = matter(raw);
  return { frontmatter, body, articlePath };
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Merges enriched fields back into the frontmatter and writes the updated MDX
 * file. Uses `fs.promises` to avoid blocking the event loop.
 */
export async function writeEnrichedFields(
  articlePath: string,
  originalFrontmatter: Record<string, unknown>,
  body: string,
  result: EnrichmentResult,
): Promise<void> {
  const updatedData: Record<string, unknown> = {
    ...originalFrontmatter,
    quickTake: result.quickTake,
    whyItMatters: result.whyItMatters,
    takeaways: Array.from(result.takeaways),
  };
  const updatedMdx = matter.stringify(body, updatedData);
  await fs.writeFile(articlePath, updatedMdx, "utf8");
}
