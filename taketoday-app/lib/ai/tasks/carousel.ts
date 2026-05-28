/**
 * Carousel generation — the premier use case of TakeToday's AI system.
 * Returns fully structured output ready for rendering.
 */

import { orchestrator } from "../core/orchestrator";
import { aiLogger } from "../core/logger";
import { AIProviderError } from "../core/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CarouselSlideType = "title" | "content" | "cta" | "stat" | "quote";

export type CarouselFormat =
  | "instagram"
  | "linkedin"
  | "twitter"
  | "educational"
  | "story";

export interface CarouselSlide {
  slideNumber: number;
  type: CarouselSlideType;
  heading: string;
  body: string;
  imagePrompt: string;
  visualStyle: string;
  layoutHint: string;
}

export interface CarouselOutput {
  title: string;
  format: CarouselFormat;
  slideCount: number;
  slides: CarouselSlide[];
  brandingNotes: string;
  colorPalette: string[];
  fontStyle: string;
}

export interface CarouselGenerationOpts {
  format: CarouselFormat;
  slideCount: number;
  brandName?: string;
  ctaText?: string;
  tone?: string;
  targetAudience?: string;
  colorScheme?: string;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

export const CAROUSEL_SYSTEM_PROMPT = `You are an expert social media content strategist and visual storytelling specialist.
Your role is to transform content into compelling carousel posts optimized for maximum engagement.

CRITICAL: Return ONLY valid JSON. No markdown, no code fences, no explanation text — pure JSON only.

Your output must be a valid JSON object matching this exact structure:
{
  "title": "string — overall carousel title",
  "format": "instagram|linkedin|twitter|educational|story",
  "slideCount": number,
  "slides": [
    {
      "slideNumber": number,
      "type": "title|content|cta|stat|quote",
      "heading": "string — bold, punchy, max 10 words",
      "body": "string — supporting text, max 40 words",
      "imagePrompt": "string — detailed visual description for image generation",
      "visualStyle": "string — photography style, illustration style, etc.",
      "layoutHint": "string — layout guidance, e.g. 'text-left, image-right'"
    }
  ],
  "brandingNotes": "string — brand consistency recommendations",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "fontStyle": "string — font pairing recommendation"
}

Platform-specific guidance:
- Instagram: Visual-first, bold typography, 5-10 slides, warm/vibrant colors
- LinkedIn: Professional tone, data-driven, 5-8 slides, navy/blue/white palette
- Twitter: Punchy, meme-able, 3-5 slides, high contrast
- Educational: Step-by-step, numbered, clear hierarchy, 6-10 slides
- Story: Vertical format, full-bleed visuals, minimal text, 3-7 slides

Slide type roles:
- "title": Hook slide — the first impression, must stop the scroll
- "content": Main information — one idea per slide, scannable
- "stat": Data point — large number, short context
- "quote": Pull quote — attributed, visually distinct
- "cta": Call to action — last slide, clear action verb

Visual storytelling principles:
1. Every slide must stand alone yet connect to the whole
2. Visual contrast drives readability
3. White space is not wasted space
4. Color psychology matters — choose intentionally
5. The final slide must compel action`;

// ─── Prompt Builder ───────────────────────────────────────────────────────────

export function buildCarouselPrompt(
  content: string,
  opts: CarouselGenerationOpts
): string {
  const parts: string[] = [
    `Transform the following content into a ${opts.format} carousel with exactly ${opts.slideCount} slides.`,
  ];

  if (opts.brandName) {
    parts.push(`Brand name: ${opts.brandName}`);
  }

  if (opts.tone) {
    parts.push(`Tone: ${opts.tone}`);
  }

  if (opts.targetAudience) {
    parts.push(`Target audience: ${opts.targetAudience}`);
  }

  if (opts.colorScheme) {
    parts.push(`Color scheme preference: ${opts.colorScheme}`);
  }

  if (opts.ctaText) {
    parts.push(
      `CTA text for the final slide: "${opts.ctaText}". The last slide must be type "cta" and use this exact CTA.`
    );
  }

  parts.push(`\nContent to transform:\n${content}`);
  parts.push(
    `\nRemember: Return ONLY valid JSON matching the schema. No markdown. No explanation. Exactly ${opts.slideCount} slides.`
  );

  return parts.join("\n");
}

// ─── Main Function ────────────────────────────────────────────────────────────

function parseCarouselJson(text: string): CarouselOutput {
  let cleaned = text.trim();

  // Strip markdown code fences if present (defensive)
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }

  return JSON.parse(cleaned.trim()) as CarouselOutput;
}

export async function generateCarousel(
  content: string,
  opts: CarouselGenerationOpts
): Promise<CarouselOutput> {
  const prompt = buildCarouselPrompt(content, opts);

  const result = await orchestrator.execute({
    type: "CAROUSEL_GENERATION",
    prompt,
    systemPrompt: CAROUSEL_SYSTEM_PROMPT,
    jsonMode: true,
    temperature: 0.7,
    maxTokens: 4096,
    metadata: { format: opts.format, slideCount: opts.slideCount },
  });

  let parsed: CarouselOutput;

  try {
    parsed = parseCarouselJson(result.text);
  } catch (parseErr) {
    // Retry once with stricter prompt
    aiLogger.warn("Carousel JSON parse failed, retrying with stricter prompt", {
      taskType: "CAROUSEL_GENERATION",
      provider: result.provider,
      error: parseErr instanceof Error ? parseErr.message : String(parseErr),
    });

    const strictPrompt =
      `STRICT MODE: The previous response was not valid JSON. You MUST return ONLY a JSON object, nothing else.\n\n` +
      prompt +
      `\n\nFinal reminder: Your ENTIRE response must be parseable by JSON.parse(). Start with { and end with }.`;

    const retry = await orchestrator.execute({
      type: "CAROUSEL_GENERATION",
      prompt: strictPrompt,
      systemPrompt: CAROUSEL_SYSTEM_PROMPT,
      jsonMode: true,
      temperature: 0.3,
      maxTokens: 4096,
    });

    try {
      parsed = parseCarouselJson(retry.text);
    } catch (retryErr) {
      throw new AIProviderError(
        `Failed to parse carousel JSON after retry: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`,
        result.provider,
        "unknown",
        false
      );
    }
  }

  // Validate slide count
  if (parsed.slides.length !== opts.slideCount) {
    aiLogger.warn(
      `Carousel slide count mismatch: expected ${opts.slideCount}, got ${parsed.slides.length}`,
      { taskType: "CAROUSEL_GENERATION", provider: result.provider }
    );
    // Adjust slideCount to match what was actually returned
    parsed.slideCount = parsed.slides.length;
  }

  return parsed;
}
