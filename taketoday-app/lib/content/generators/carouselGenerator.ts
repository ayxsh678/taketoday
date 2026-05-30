import OpenAI from "openai";
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

const TEMPLATE_SPECS: Record<string, string> = {
  "taketoday-dark": `VISUAL TEMPLATE — TakeToday Dark (mandatory):
  - Background: pure black (#000000)
  - Primary heading: white, bold serif font, 2-3 lines max
  - Accent subheading (accentHeading field): red/coral (#E8432D), bold serif, punchy 1-line stat or claim
  - Divider: short red horizontal rule below accentHeading
  - Body: white regular weight, 2-3 short paragraphs, max 40 words total
  - highlightTerms: 1-3 key quoted phrases from body to render in red (e.g. "Super El Niño")
  - Image: dramatic, data-visual or news photo — full-bleed at bottom of slide
  - Watermark: @taketoday.co bottom-right (always)
  - Overall: editorial newspaper feel, high contrast, no decorative elements`,
  "minimal-light": `VISUAL TEMPLATE — Minimal Light:
  - Background: white (#FFFFFF)
  - Heading: near-black, bold sans-serif
  - Body: dark gray, regular weight
  - Accent: brand blue
  - Image: top or center placement`,
};

function buildPrompt(content: string, opts: CarouselOptions): string {
  const fmt = opts.format ?? "instagram";
  const count = Math.max(2, Math.min(12, opts.slideCount ?? 5));
  const templateId = opts.templateId ?? "taketoday-dark";
  const templateSpec = TEMPLATE_SPECS[templateId] ?? TEMPLATE_SPECS["taketoday-dark"];
  const brand = opts.brandName ? ` Brand: ${opts.brandName}.` : "";
  const cta = opts.ctaText ? ` CTA: "${opts.ctaText}".` : "";

  return `Create a ${fmt} carousel with exactly ${count} slides for this news content:

${content.slice(0, 1500)}
${brand}${cta}

${templateSpec}

Return ONLY valid JSON matching this structure (no markdown, no explanation):
{
  "title": "carousel title (max 60 chars)",
  "format": "${fmt}",
  "templateId": "${templateId}",
  "slideCount": ${count},
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "heading": "primary hook headline — white bold serif (max 10 words)",
      "accentHeading": "red accent stat or claim (max 8 words)",
      "body": "2-3 short paragraphs of supporting text (max 40 words total)",
      "highlightTerms": "term1, term2",
      "imagePrompt": "dramatic news photo or data visual for full-bleed bottom image",
      "visualStyle": "black background, white heading, red accentHeading, body with red highlights, @taketoday.co watermark"
    }
  ],
  "brandingNotes": "consistency notes"
}

Rules:
- Slide 1: type "title" — bold hook heading + red accentHeading with punchy stat/claim
- Slides 2 to ${count - 1}: type "content" — one clear insight per slide, always include accentHeading and highlightTerms
- Slide ${count}: type "cta" — "Follow @taketoday.co for more" style, no imagePrompt needed
- headings: max 10 words
- body: max 40 words per slide
- accentHeading: always present, max 8 words, stat or bold claim
- highlightTerms: 1-3 key quoted phrases from the body to render in red`;
}

// ─── Dev-only mock ────────────────────────────────────────────────────────────

function buildMockCarousel(content: string, opts: CarouselOptions): CarouselOutput {
  const fmt = (opts.format ?? "instagram") as CarouselFormat;
  const templateId = opts.templateId ?? "taketoday-dark";
  const count = Math.max(2, Math.min(12, opts.slideCount ?? 5));
  const preview = content.slice(0, 80);
  const slides: CarouselSlide[] = [];

  slides.push({
    slideNumber: 1,
    type: "title",
    heading: preview.slice(0, 50),
    accentHeading: "Here's what you need to know.",
    body: "Swipe to learn more →",
    highlightTerms: "",
    imagePrompt: `Dramatic news photo for full-bleed bottom image — ${preview.slice(0, 40)}`,
    visualStyle: "Black background, white bold serif heading, red accentHeading, @taketoday.co watermark",
  });

  for (let i = 2; i < count; i++) {
    slides.push({
      slideNumber: i,
      type: "content",
      heading: `Key insight ${i - 1}`,
      accentHeading: `Fact ${i - 1}: one bold stat here.`,
      body: `${preview.slice(0, 40)} — point ${i - 1}`,
      highlightTerms: `point ${i - 1}`,
      imagePrompt: `Data visual or news photo supporting insight ${i - 1}`,
      visualStyle: "Black background, red accentHeading, body with red highlights",
    });
  }

  slides.push({
    slideNumber: count,
    type: "cta",
    heading: opts.ctaText ?? "Follow @taketoday.co for more",
    accentHeading: "Stay informed. Every day.",
    body: "Share this with someone who needs to see it.",
    highlightTerms: "",
    imagePrompt: "",
    visualStyle: "Black background, TakeToday TT logo centered, @taketoday.co watermark",
  });

  return {
    title: preview.slice(0, 60),
    format: fmt,
    templateId,
    slideCount: count,
    slides,
    brandingNotes: `TakeToday dark template: black bg, white serif headings, red (#E8432D) accent headings and highlights, @taketoday.co watermark bottom-right on every slide.`,
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

    // Default to TakeToday dark template
    if (!opts.templateId) opts.templateId = "taketoday-dark";

    await markRunning(jobId);

    pipelineLogger.info({
      stage: "generate",
      format: "carousel",
      jobId,
      message: "Carousel generation started",
    });

    // Dev-only mock path — no API key required
    if (appConfig.isDevelopment && !appConfig.openaiApiKey) {
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

    if (!appConfig.openaiApiKey) {
      const error = "OPENAI_API_KEY not configured";
      await markFailed(jobId, error);
      pipelineLogger.error({ stage: "generate", format: "carousel", jobId, message: error });
      return { ok: false, format: "carousel", error, jobId };
    }

    try {
      const output = await withRetry(
        async () => {
          const openai = new OpenAI({ apiKey: appConfig.openaiApiKey });

          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            max_tokens: 2048,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: "You are a social media content designer. Return only valid JSON, no markdown, no explanation.",
              },
              { role: "user", content: buildPrompt(content, opts) },
            ],
          });

          const text = completion.choices[0]?.message?.content ?? "";

          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON in OpenAI response");

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
