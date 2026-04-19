import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import readingTime from "reading-time";

/**
 * TakeToday — Contentlayer schema
 *
 * MDX files in `content/articles/` are the source of truth.
 * Contentlayer watches them during `next dev` and generates fully-typed
 * document data at build time. The generated output lives in `.contentlayer/generated/`.
 *
 * Important notes:
 * - `publishedAt` / `updatedAt` stay as `string` (not `date`) to keep the
 *   ISO-8601 format consistent with `ISODateString` in `types/article.ts`.
 * - `author` uses `type: 'json'` instead of `defineNestedType` because
 *   Contentlayer injects a `type: "Author"` discriminator into nested objects,
 *   which would stomp our `type: Organization | Person` frontmatter value.
 *   With `json`, the raw frontmatter object is passed through unchanged.
 */

// ─── Article document ─────────────────────────────────────────────────────────

export const Article = defineDocumentType(() => ({
  name: "Article",
  filePathPattern: "articles/**/*.mdx",
  contentType: "mdx",
  fields: {
    slug: { type: "string", required: true },
    title: { type: "string", required: true },
    deck: { type: "string", required: true },
    category: {
      type: "enum",
      options: ["AI", "Finance", "Tech", "Startups", "Briefings"],
      required: true,
    },
    format: {
      type: "enum",
      options: ["QuickNews", "SmartBreakdown", "DeepDive", "SocialPost"],
      required: true,
    },
    // Kept as string to preserve ISO-8601 format (not converted to Date).
    publishedAt: { type: "string", required: true },
    updatedAt: { type: "string", required: false },
    // json: passes the raw frontmatter object through without CL's type injection.
    author: { type: "json", required: true },
    quickTake: { type: "string", required: true },
    whyItMatters: { type: "string", required: true },
    // Contentlayer doesn't support tuples; we enforce the 3-item constraint
    // at runtime in the loader via Zod validation.
    takeaways: { type: "list", of: { type: "string" }, required: true },
  },
  computedFields: {
    /** Mirrors the formatReadTime logic in the old loader. */
    readTime: {
      type: "string",
      resolve: (doc) => {
        const minutes = readingTime(doc.body.raw).minutes;
        const m = Math.max(1, Math.ceil(minutes));
        return `${m} min read`;
      },
    },
  },
}));

// ─── Source ───────────────────────────────────────────────────────────────────

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Article],
  disableImportAliasWarning: true,
});
