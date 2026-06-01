import { jsonError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { z } from "zod";
import { JobStatus, Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin/authz";
import { generateCarousel } from "@/lib/ai/tasks/carousel";
import { prisma } from "@/lib/db/prisma";

const carouselRequestSchema = z.object({
  content: z.string().min(10).max(8000),
  format: z.enum(["instagram", "linkedin", "twitter", "educational", "story"]),
  slideCount: z.number().int().min(3).max(12),
  brandName: z.string().max(80).optional(),
  ctaText: z.string().max(120).optional(),
  tone: z.string().max(80).optional(),
  targetAudience: z.string().max(120).optional(),
  colorScheme: z.string().max(80).optional(),
  articleId: z.string().cuid().optional(),
});

export async function POST(req: NextRequest) {
  const access = await requireAdmin("ai:run");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = carouselRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const { content, format, slideCount, brandName, ctaText, tone, targetAudience, colorScheme, articleId } =
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

    const job = await prisma.carouselJob.create({
      data: {
        format,
        slideCount: carousel.slideCount,
        sourceContent: content,
        result: carousel as unknown as Prisma.InputJsonValue,
        articleId: articleId ?? null,
        status: JobStatus.SUCCEEDED,
      },
    });

    return jsonOk({ carousel, jobId: job.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Carousel generation failed";
    return jsonError(`Carousel generation failed: ${msg}`, 502);
  }
}
