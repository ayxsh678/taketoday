// ─── Content format registry ──────────────────────────────────────────────────

export const CONTENT_FORMATS = ["article", "image_post", "video_reel", "carousel"] as const;
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

// ─── Format-specific options ──────────────────────────────────────────────────

export interface ArticleOptions {
  length?: "short" | "medium" | "long";
  tone?: string;
  category?: string;
  region?: string;
}

export interface ImageOptions {
  style?: "news" | "social" | "branded";
  aspectRatio?: "1:1" | "4:5" | "16:9" | "9:16";
}

export interface VideoOptions {
  type?: "reel" | "explainer" | "breaking";
  /** Target duration in seconds */
  duration?: number;
  voiceProvider?: string;
  avatarProvider?: string;
}

export type CarouselFormat = "instagram" | "linkedin" | "educational" | "story";

export interface CarouselOptions {
  format?: CarouselFormat;
  /** Number of slides (2–12). Default 5. */
  slideCount?: number;
  brandName?: string;
  ctaText?: string;
  /**
   * Visual template ID. Defaults to "taketoday-dark".
   * "taketoday-dark": black bg, white serif headline, red accent subheadline,
   *   body with "quoted" red highlights, full-bleed bottom image, @taketoday.co watermark.
   */
  templateId?: "taketoday-dark" | "minimal-light";
}

export interface GenerationOptions {
  article?: ArticleOptions;
  image?: ImageOptions;
  video?: VideoOptions;
  carousel?: CarouselOptions;
}

// ─── Shared result type ───────────────────────────────────────────────────────

export type GenerationResult<T = unknown> =
  | { ok: true; format: ContentFormat; data: T; jobId?: string }
  | { ok: false; format: ContentFormat; error: string; jobId?: string };

// ─── Generator config ─────────────────────────────────────────────────────────

export interface GeneratorConfig {
  /** Max attempts including first try */
  maxAttempts?: number;
  /** Timeout per attempt in ms */
  timeoutMs?: number;
}

// ─── Generator interface (strategy) ──────────────────────────────────────────

export interface ContentGenerator<TOutput = unknown> {
  readonly format: ContentFormat;
  generate(
    content: string,
    options?: GenerationOptions,
    jobId?: string,
  ): Promise<GenerationResult<TOutput>>;
}

// ─── Pipeline request / response ─────────────────────────────────────────────

export interface PipelineRequest {
  content: string;
  formats: ContentFormat[];
  options?: GenerationOptions;
  /** Optional article DB ID to associate generated content with */
  articleId?: string;
  /** Caller-supplied idempotency key; namespaced per-format inside pipeline */
  idempotencyKey?: string;
}

export interface PipelineResponse {
  results: GenerationResult[];
  succeeded: number;
  failed: number;
}

// ─── Carousel output types ────────────────────────────────────────────────────

export interface CarouselSlide {
  slideNumber: number;
  /** "title" = first slide, "content" = middle slides, "cta" = last slide */
  type: "title" | "content" | "cta";
  heading: string;
  /** Red accent subheadline (taketoday-dark template) */
  accentHeading?: string;
  body: string;
  /** Comma-separated key terms to highlight in red in the body */
  highlightTerms?: string;
  /** Prompt description for downstream image generation */
  imagePrompt: string;
  visualStyle: string;
}

export interface CarouselOutput {
  title: string;
  templateId?: string;
  format: CarouselFormat;
  slideCount: number;
  slides: CarouselSlide[];
  brandingNotes: string;
}
