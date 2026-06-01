import { jsonError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/authz";
import { generateCarousel } from "@/lib/ai/tasks/carousel";
import type { CarouselFormat } from "@/lib/ai/tasks/carousel";

const FORMATS: CarouselFormat[] = ["instagram", "linkedin", "twitter", "educational", "story"];

const carouselRequestSchema = z.object({
  content: z.string().min(10).max(8000),
  format: z.enum(["instagram", "linkedin", "twitter", "educational", "story"]),
  slideCount: z.number().int().min(3).max(12),
  brandName: z.string().max(80).optional(),
  ctaText: z.string().max(120).optional(),
  tone: z.string().max(80).optional(),
  targetAudience: z.string().max(120).optional(),
  colorScheme: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  const access = await requireAdmin("ai:run");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = carouselRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const { content, format, slideCount, brandName, ctaText, tone, targetAudience, colorScheme } =
    parsed.data;

  try {
    const carousel = await generateCarousel(content, {
      format,
      slideCount,
      brandName,
      ctaText,
      tone,
      targetAudience,
      colorScheme,
    });

    return jsonOk({ carousel });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Carousel generation failed";
    return jsonError(`Carousel generation failed: ${msg}`, 502);
  }
}

export { FORMATS };
