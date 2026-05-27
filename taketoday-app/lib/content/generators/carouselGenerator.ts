import Anthropic from "@anthropic-ai/sdk";
import { appConfig } from "@/lib/config/app";
import type {
  CarouselFormat,
  CarouselOptions,
  CarouselOutput,
  CarouselSlide,
  ContentGenerator,
  GenerationOptions,
  GenerationResult,
} from "./types";
import { withRetry, DEFAULT_RETRY } from "./retry";
import { createContentJob, markRunning, markSucceeded, markFailed, markRetrying } from "./jobTracker";
import { pipelineLogger } from "./logger";
import { Prisma } from "@prisma/client";

// ─── Claude prompt ────────────────────────────────────────────────────────────

function buildPrompt(content: string, opts: CarouselOptions): string {
  const fmt = opts.format ?? "instagram";
  const count = Math.max(2, Math.min(12, opts.slideCount ?? 5));
  const brand = opts.brandName ? ` Brand: ${opts.brandName}.` : "";
  const cta = opts.ctaText ? ` CTA: "${opts.ctaText}".` : "";

  return `Create a ${fmt} carousel with exactly ${count} slides for this content:

${content.slice(0, 1500)}
${brand}${cta}

Return ONLY valid JSON matching this structure (no markdown, no explanation):
{
  "title": "carousel title (max 60 chars)",
  "format": "${fmt}",
  "slideCount": ${count},
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "heading": "hook headline (max 10 words)",
      "body": "supporting text (max 30 words)",
      "imagePrompt": "visual description for image generation",
      "visualStyle": "style notes for designer"
    }
  ],
  "brandingNotes": "consistency notes for the full carousel"
}

Rules:
- Slide 1: type "title" — bold hook, strong opening
- Slides 2 to ${count - 1}: type "content" — one clear insight per slide
- Slide ${count}: type "cta" — clear call to action
- Headings: max 10 words
- Body: max 40 words per slide
- imagePrompt: describe a concrete visual (not abstract)
- Format for ${fmt}: ${fmt === "instagram" ? "square or portrait, vibrant, bold text" : fmt === "linkedin" ? "professional, data-forward, muted palette" : fmt === "educational" ? "step-by-step, numbered, clean whitespace" : "vertical story format, full-bleed images, minimal text"}`;
}

// ─── Dev-only mock ────────────────────────────────────────────────────────────

function buildMockCarousel(content: string, opts: CarouselOptions): CarouselOutput {
  const fmt = (opts.format ?? "instagram") as CarouselFormat;
  const count = Math.max(2, Math.min(12, opts.slideCount ?? 5));
  const preview = content.slice(0, 80);
  const slides: CarouselSlide[] = [];

  slides.push({
    slideNumber: 1,
    type: "title",
    heading: preview.slice(0, 50),
    body: "Swipe to learn more →",
    imagePrompt: `Bold ${fmt} title card with high contrast typography`,
    visualStyle: "High contrast, brand primary color background",
  });

  for (let i = 2; i < count; i++) {
    slides.push({
      slideNumber: i,
      type: "content",
      heading: `Key insight ${i - 1}`,
      body: `${preview.slice(0, 40)} — point ${i - 1}`,
      imagePrompt: `Clean visual supporting insight ${i - 1}`,
      visualStyle: "Minimal, white background, accent color highlight",
    });
  }

  slides.push({
    slideNumber: count,
    type: "cta",
    heading: opts.ctaText ?? "Follow for more",
    body: "Share this with someone who needs to see it.",
    imagePrompt: `${fmt} CTA card with ${opts.brandName ?? "TakeToday"} branding`,
    visualStyle: "Brand color, bold CTA, logo placement bottom-right",
  });

  return {
    title: preview.slice(0, 60),
    format: fmt,
    slideCount: count,
    slides,
    brandingNotes: `Maintain consistent typography, ${opts.brandName ?? "brand"} colors, and logo placement across all ${count} slides.`,
  };
}

// ─── Generator ────────────────────────────────────────────────────────────────

export const carouselGenerator: ContentGenerator<CarouselOutput> = {
  format: "carousel",

  async generate(
    content: string,
    options?: GenerationOptions,
    existingJobId?: string,
  ): Promise<GenerationResult<CarouselOutput>> {
    const opts: CarouselOptions = options?.carousel ?? {};
    const t0 = Date.now();

    const { id: jobId } = existingJobId
      ? { id: existingJobId }
      : await createContentJob("carousel", opts.format ?? "instagram");

    await markRunning(jobId);

    pipelineLogger.info({
      stage: "generate",
      format: "carousel",
      jobId,
      message: "Carousel generation started",
    });

    // Dev-only mock path — no Claude call, no API key required
    if (appConfig.isDevelopment && !appConfig.anthropicApiKey) {
      const mock = buildMockCarousel(content, opts);
      await markSucceeded(jobId, mock as unknown as Prisma.InputJsonValue);
      pipelineLogger.info({
        stage: "generate",
        format: "carousel",
        jobId,
        durationMs: Date.now() - t0,
        message: "Carousel generation succeeded (dev mock)",
      });
      return { ok: true, format: "carousel", data: mock, jobId };
    }

    if (!appConfig.anthropicApiKey) {
      const error = "ANTHROPIC_API_KEY not configured";
      await markFailed(jobId, error);
      pipelineLogger.error({ stage: "generate", format: "carousel", jobId, message: error });
      return { ok: false, format: "carousel", error, jobId };
    }

    try {
      const output = await withRetry(
        async () => {
          const anthropic = new Anthropic({ apiKey: appConfig.anthropicApiKey });

          const message = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2048,
            system:
              "You are a social media content designer. Return only valid JSON, no markdown, no explanation.",
            messages: [{ role: "user", content: buildPrompt(content, opts) }],
          });

          const text =
            message.content[0]?.type === "text" ? message.content[0].text : "";

          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON in Claude response");

          return JSON.parse(jsonMatch[0]) as CarouselOutput;
        },
        DEFAULT_RETRY,
        (err, attempt, nextDelayMs) => {
          pipelineLogger.warn({
            stage: "generate",
            format: "carousel",
            jobId,
            attempt,
            message: `Retrying after error: ${err instanceof Error ? err.message : String(err)}`,
            nextDelayMs,
          });
          void markRetrying(jobId, attempt);
        },
      );

      await markSucceeded(jobId, output as unknown as Prisma.InputJsonValue);

      pipelineLogger.info({
        stage: "generate",
        format: "carousel",
        jobId,
        durationMs: Date.now() - t0,
        message: "Carousel generation succeeded",
      });

      return { ok: true, format: "carousel", data: output, jobId };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Carousel generation failed";

      await markFailed(jobId, error);

      pipelineLogger.error({
        stage: "generate",
        format: "carousel",
        jobId,
        durationMs: Date.now() - t0,
        message: error,
      });

      return { ok: false, format: "carousel", error, jobId };
    }
  },
};
