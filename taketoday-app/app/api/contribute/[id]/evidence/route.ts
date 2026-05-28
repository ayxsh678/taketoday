import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";
import { logTransparencyEvent } from "@/lib/contributor/workflow";

const evidenceSchema = z.object({
  type: z.enum([
    "DOCUMENT",
    "IMAGE",
    "VIDEO",
    "URL",
    "DATA_FILE",
    "QUOTE",
    "TESTIMONY",
    "COURT_RECORD",
    "FINANCIAL_RECORD",
    "GOVERNMENT_RECORD",
  ]),
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  url: z.string().url().optional(),
  fileUrl: z.string().url().optional(),
  publicId: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("evidence:upload");
  if (!access.ok) return access.response;

  const contribution = await prisma.contribution.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!contribution) return jsonError("Not found", 404);

  const body: unknown = await req.json().catch(() => null);
  const parsed = evidenceSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  if (!parsed.data.url && !parsed.data.fileUrl) {
    return jsonError("Evidence must have a url or fileUrl", 422);
  }

  const evidence = await prisma.evidence.create({
    data: {
      contributionId: id,
      submittedById: access.session.id,
      ...parsed.data,
    },
  });

  await logTransparencyEvent(
    id,
    "EVIDENCE_UPLOADED",
    access.session.id,
    "PublicUser",
    `Evidence uploaded: ${parsed.data.type} — ${parsed.data.title}`,
    { evidenceType: parsed.data.type },
  );

  return jsonOk({ evidence }, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const evidence = await prisma.evidence.findMany({
    where: { contributionId: id },
    orderBy: { createdAt: "desc" },
    include: {
      submittedBy: { select: { id: true, username: true, displayName: true } },
    },
  });

  return jsonOk({ evidence });
}
