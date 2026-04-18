import { z } from "zod";
import type {
  Article,
  ArticleContent,
  ArticleMetadata,
  Author,
} from "@/types/article";

/**
 * TakeToday — Content validation (Zod)
 * Two schemas live here:
 *   1. `articleFrontmatterSchema` — validates the raw frontmatter parsed
 *      out of an .mdx file. No computed fields (readTime).
 *   2. `articleSchema` — validates the fully-enriched Article object the
 *      loader returns (with readTime computed + body attached).
 *
 * Both are `z.ZodType<T>` so any drift from `types/article.ts` is a
 * type error at the module boundary, not a silent mismatch.
 */

// ─── Primitives ───────────────────────────────────────────────────────────

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugSchema = z.string().regex(SLUG_REGEX, {
  message: "slug must be kebab-case (lowercase, digits, and single hyphens)",
});

const isoDateSchema = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), "must be an ISO-8601 date-time");

const nonEmpty = z.string().min(1);

// ─── Enums ────────────────────────────────────────────────────────────────

export const CATEGORY_VALUES = [
  "AI",
  "Finance",
  "Tech",
  "Startups",
  "Briefings",
] as const;

export const FORMAT_VALUES = [
  "QuickNews",
  "SmartBreakdown",
  "DeepDive",
  "SocialPost",
] as const;

const categorySchema = z.enum(CATEGORY_VALUES);
const formatSchema = z.enum(FORMAT_VALUES);

// ─── Author ───────────────────────────────────────────────────────────────

const authorSchema: z.ZodType<Author> = z.object({
  name: nonEmpty,
  type: z.enum(["Organization", "Person"]),
});

// ─── Takeaways tuple ──────────────────────────────────────────────────────

const takeawaysSchema = z.tuple([nonEmpty, nonEmpty, nonEmpty]);

// ─── Frontmatter (what lives at the top of each .mdx file) ────────────────

/**
 * Raw frontmatter shape. Intentionally omits `readTime`, which is computed
 * from the MDX body by the loader. All other fields from `ArticleMetadata`
 * are required here.
 */
export const articleFrontmatterSchema = z.object({
  slug: slugSchema,
  title: nonEmpty,
  deck: nonEmpty,
  category: categorySchema,
  format: formatSchema,
  publishedAt: isoDateSchema,
  updatedAt: isoDateSchema.optional(),
  author: authorSchema,
  quickTake: nonEmpty,
  whyItMatters: nonEmpty,
  takeaways: takeawaysSchema,
});

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;

// ─── Metadata + Content (post-enrichment) ─────────────────────────────────

const articleMetadataSchema: z.ZodType<ArticleMetadata> = z.object({
  slug: slugSchema,
  title: nonEmpty,
  deck: nonEmpty,
  category: categorySchema,
  format: formatSchema,
  readTime: nonEmpty,
  publishedAt: isoDateSchema,
  updatedAt: isoDateSchema.optional(),
  author: authorSchema,
});

const articleContentSchema: z.ZodType<ArticleContent> = z.object({
  body: z.string(),
  quickTake: nonEmpty,
  whyItMatters: nonEmpty,
  takeaways: takeawaysSchema,
});

/**
 * Full Article as returned by the loader / queries.
 * Use this to validate anything crossing a module boundary.
 */
export const articleSchema: z.ZodType<Article> = z.object({
  metadata: articleMetadataSchema,
  content: articleContentSchema,
});
