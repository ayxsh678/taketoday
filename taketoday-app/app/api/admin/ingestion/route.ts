import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { z } from "zod";
import { JobStatus, Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin/authz";
import { logAuditAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/prisma";

const JOB_TYPES = ["rss", "url", "scrape", "youtube", "x_trend"] as const;

const ingestionSchema = z.object({
  type: z.enum(JOB_TYPES),
  source: z.string().min(5),
  sourceId: z.string().optional(),
});

const validStatuses = new Set(Object.values(JobStatus));

function mapJob(
  job: {
    id: string;
    type: string;
    status: JobStatus;
    input: string;
    error: string | null;
    result: unknown;
    createdAt: Date;
    updatedAt: Date;
    source?: { name: string; type: string } | null;
  },
) {
  return {
    id: job.id,
    type: job.type,
    status: job.status.toLowerCase(),
    input: job.input,
    error: job.error,
    result: job.result,
    source: job.source ? { name: job.source.name, type: job.source.type } : null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {

  const access = await requireAdmin("ingestion:write");
  if (!access.ok) return access.response;

  const status = request.nextUrl.searchParams.get("status")?.toUpperCase();
  const type = request.nextUrl.searchParams.get("type");
  const where: Prisma.IngestionJobWhereInput = {};

  if (status && validStatuses.has(status as JobStatus)) {
    where.status = status as JobStatus;
  }
  if (type) {
    where.type = type;
  }

  const [jobs, stats] = await Promise.all([
    prisma.ingestionJob.findMany({
      where,
      include: { source: { select: { name: true, type: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    Promise.all(
      Object.values(JobStatus).map((s) =>
        prisma.ingestionJob.count({ where: { status: s } }).then((n) => [s, n] as const),
      ),
    ),
  ]);

  const statusCounts = Object.fromEntries(stats);

  return jsonOk({ jobs: jobs.map(mapJob), stats: statusCounts, total: jobs.length });
}

export async function POST(req: NextRequest) {

  const access = await requireAdmin("ingestion:write");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = ingestionSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const { type, source, sourceId } = parsed.data;

  try {
    const job = await prisma.ingestionJob.create({
      data: {
        type,
        input: source,
        status: JobStatus.QUEUED,
        sourceId: sourceId ?? null,
      },
      include: { source: { select: { name: true, type: true } } },
    });

    await logAuditAction({
      action: "create_ingestion_job",
      entity: "ingestion_job",
      entityId: job.id,
      after: { type, input: source },
    });

    return jsonOk({ job: mapJob(job) }, { status: 201 });
  } catch (error) {
    return captureApiError(error);
  }
}
