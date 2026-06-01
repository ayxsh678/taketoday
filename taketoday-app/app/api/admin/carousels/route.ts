import { jsonError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";
import type { CarouselOutput } from "@/lib/ai/tasks/carousel";

export async function GET(request: NextRequest) {
  const access = await requireAdmin("ai:run");
  if (!access.ok) return access.response;

  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const where: Prisma.CarouselJobWhereInput = format ? { format } : {};

  const [jobs, total] = await Promise.all([
    prisma.carouselJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      include: { article: { select: { id: true, headline: true, slug: true } } },
    }),
    prisma.carouselJob.count({ where }),
  ]);

  const mapped = jobs.map((job) => {
    const result = job.result as unknown as CarouselOutput;
    return {
      id: job.id,
      format: job.format,
      slideCount: job.slideCount,
      title: result?.title ?? "",
      status: job.status.toLowerCase(),
      articleId: job.articleId,
      articleHeadline: job.article?.headline ?? null,
      articleSlug: job.article?.slug ?? null,
      createdAt: job.createdAt.toISOString(),
    };
  });

  return jsonOk({ jobs: mapped, total, page, limit, totalPages: Math.ceil(total / limit) });
}
