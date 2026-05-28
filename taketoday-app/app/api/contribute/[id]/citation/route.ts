import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";
import { logTransparencyEvent } from "@/lib/contributor/workflow";

const citationSchema = z.object({
  url: z.string().url(),
  title: z.string().max(300).optional(),
  excerpt: z.string().max(500).optional(),
  publishedAt: z.string().datetime().optional(),
  type: z.enum([
    "NEWS_OUTLET",
    "GOVERNMENT_DOCUMENT",
    "ACADEMIC_PAPER",
    "SOCIAL_MEDIA",
    "PRIMARY_DOCUMENT",
    "WITNESS_TESTIMONY",
    "FINANCIAL_FILING",
    "COURT_DOCUMENT",
    "NGO_REPORT",
    "PRESS_RELEASE",
  ]),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("citation:add");
  if (!access.ok) return access.response;

  const contribution = await prisma.contribution.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!contribution) return jsonError("Not found", 404);

  const body: unknown = await req.json().catch(() => null);
  const parsed = citationSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const citation = await prisma.citationNode.create({
    data: {
      contributionId: id,
      url: parsed.data.url,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      publishedAt: parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : undefined,
      type: parsed.data.type,
    },
  });

  await logTransparencyEvent(
    id,
    "SOURCE_ADDED",
    access.session.id,
    "PublicUser",
    `Source added: ${parsed.data.type}`,
    { url: parsed.data.url, type: parsed.data.type },
  );

  return jsonOk({ citation }, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const citations = await prisma.citationNode.findMany({
    where: { contributionId: id },
    orderBy: { accessedAt: "desc" },
  });

  return jsonOk({ citations });
}
