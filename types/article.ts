/**
 * TakeToday — Core Type System
 * ============================================================================
 * Strict, production-ready TypeScript types for the TakeToday news platform.
 *
 * Powers:
 *   • Articles (MDX content)
 *   • AI-generated insights
 *   • Homepage feed
 *   • Future CMS integration
 *
 * Design rules:
 *   • TypeScript only — no runtime validators (zod, yup, etc.)
 *   • Prefer string literal unions over `string`
 *   • `readonly` everywhere content is immutable at the boundary
 *   • Optional fields only when the field is truly optional in practice
 *   • Group related types; export everything
 * ============================================================================
 */

/* ───────────────────────────────────────────────────────────────────────── */
/* Primitive brands                                                          */
/* ───────────────────────────────────────────────────────────────────────── */

/** URL-safe kebab-case identifier (e.g. `"openai-unveils-new-model"`). */
export type Slug = string;

/** ISO-8601 date-time string (e.g. `"2026-04-18T09:00:00Z"`). */
export type ISODateString = string;

/** Raw MDX source text. Parsed downstream by `next-mdx-remote` / `@next/mdx`. */
export type MDXSource = string;

/* ───────────────────────────────────────────────────────────────────────── */
/* 1. Category                                                               */
/* ───────────────────────────────────────────────────────────────────────── */

export type Category =
  | "AI"
  | "Finance"
  | "Tech"
  | "Startups"
  | "Briefings";

export const CATEGORIES: readonly Category[] = [
  "AI",
  "Finance",
  "Tech",
  "Startups",
  "Briefings",
] as const;

/* ───────────────────────────────────────────────────────────────────────── */
/* 2. ContentFormat                                                          */
/* ───────────────────────────────────────────────────────────────────────── */

export type ContentFormat =
  | "QuickNews"       // 60–100 words
  | "SmartBreakdown"  // 150–300 words
  | "DeepDive"        // 400–700 words
  | "SocialPost";     // LinkedIn / Twitter-style, platform-agnostic

/** Word-count envelopes per format. `max: null` = unbounded. */
export const FORMAT_WORD_LIMITS: Readonly<
  Record<ContentFormat, Readonly<{ min: number; max: number | null }>>
> = {
  QuickNews:      { min: 60,  max: 100 },
  SmartBreakdown: { min: 150, max: 300 },
  DeepDive:       { min: 400, max: 700 },
  SocialPost:     { min: 1,   max: null },
} as const;

/* ───────────────────────────────────────────────────────────────────────── */
/* 3. Author                                                                 */
/* ───────────────────────────────────────────────────────────────────────── */

export type AuthorType = "Organization" | "Person";

export type Author = Readonly<{
  name: string;
  type: AuthorType;
}>;

/* ───────────────────────────────────────────────────────────────────────── */
/* 4. ArticleMetadata                                                        */
/* ───────────────────────────────────────────────────────────────────────── */

export type ArticleMetadata = Readonly<{
  slug: Slug;
  title: string;
  /** Subtitle / dek — one-line hook shown below the title. */
  deck: string;
  category: Category;
  format: ContentFormat;
  /** Human-readable read time, e.g. `"3 min read"`. */
  readTime: string;
  publishedAt: ISODateString;
  /** Present only when the article has been revised after publish. */
  updatedAt?: ISODateString;
  author: Author;
}>;

/* ───────────────────────────────────────────────────────────────────────── */
/* 5. ArticleContent                                                         */
/* ───────────────────────────────────────────────────────────────────────── */

/** Exactly three takeaways — enforced at the type level. */
export type Takeaways = readonly [string, string, string];

export type ArticleContent = Readonly<{
  body: MDXSource;
  /** One-sentence TL;DR surfaced above the fold. */
  quickTake: string;
  /** Real-world-impact paragraph. */
  whyItMatters: string;
  takeaways: Takeaways;
}>;

/* ───────────────────────────────────────────────────────────────────────── */
/* 6. Article (Main)                                                         */
/* ───────────────────────────────────────────────────────────────────────── */

export type Article = Readonly<{
  metadata: ArticleMetadata;
  content: ArticleContent;
}>;

/* ───────────────────────────────────────────────────────────────────────── */
/* 7. FeedItem — lightweight projection for homepage & lists                 */
/* ───────────────────────────────────────────────────────────────────────── */

export type FeedItem = Readonly<{
  slug: Slug;
  title: string;
  summary: string;
  category: Category;
  readTime: string;
  publishedAt: ISODateString;
}>;

/* ───────────────────────────────────────────────────────────────────────── */
/* 8. AI Output Types                                                        */
/* ───────────────────────────────────────────────────────────────────────── */

/** Single-sentence TL;DR produced by the AI pipeline. */
export type AIQuickTake = string;

/** Real-world-impact paragraph produced by the AI pipeline. */
export type AIWhyItMatters = string;

/** Exactly three bullets. */
export type AITakeaways = readonly [string, string, string];

/**
 * Full structured AI output for a single article generation run.
 * Maps 1:1 onto `ArticleContent` (minus the body formatting concerns).
 */
export type AIArticleDraft = Readonly<{
  quickTake: AIQuickTake;
  whyItMatters: AIWhyItMatters;
  takeaways: AITakeaways;
  body: MDXSource;
}>;
