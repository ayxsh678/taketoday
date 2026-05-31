import { jsonError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { z } from "zod";
import { JobStatus, Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

const createSchema = z.object({
  script: z.string().min(20).max(5000),
  voiceProvider: z.string().default("elevenlabs"),
  avatarProvider: z.string().default("heygen"),
  templateId: z.string().default("taketoday-news"),
});

function mapJob(job: Record<string, unknown> & {
  id: string;
  script: string;
  voiceProvider: string | null;
  avatarProvider: string | null;
  status: JobStatus;
  subtitleUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: job.id,
    script: job.script,
    voiceProvider: job.voiceProvider ?? "unknown",
    avatarProvider: job.avatarProvider ?? "unknown",
    templateId: (job.templateId as string | null | undefined) ?? "taketoday-news",
    status: job.status.toLowerCase(),
    subtitleUrl: job.subtitleUrl,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {

  const access = await requireAdmin("ai:run");
  if (!access.ok) return access.response;

  const status = request.nextUrl.searchParams.get("status")?.toUpperCase();
  const where: Prisma.ShortVideoJobWhereInput =
    status ? { status: status as JobStatus } : {};

  const [jobs, counts] = await Promise.all([
    prisma.shortVideoJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.shortVideoJob.groupBy({ by: ["status"], _count: { id: true } }),
  ]);

  const statusCounts = Object.fromEntries(
    counts.map((c) => [c.status.toLowerCase(), c._count.id]),
  );

  return jsonOk({ jobs: jobs.map(mapJob), stats: statusCounts, total: jobs.length });
}

export async function POST(req: NextRequest) {

  const access = await requireAdmin("ai:run");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const { script, voiceProvider, avatarProvider, templateId } = parsed.data;

  const job = await prisma.shortVideoJob.create({
    data: {
      script,
      voiceProvider,
      avatarProvider,
      // templateId added to schema — pending migration
      ...({ templateId } as Record<string, unknown>),
      status: JobStatus.QUEUED,
    },
  });

  return jsonOk({ job: mapJob(job) }, { status: 201 });
}
