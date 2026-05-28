import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";

const noteSchema = z.object({
  body: z.string().min(20).max(1000),
  type: z.enum(["CONTEXT", "CORRECTION", "MISLEADING_FRAMING", "MISSING_INFO", "OUTDATED"]),
});

const rateSchema = z.object({
  helpful: z.boolean(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("community:note");
  if (!access.ok) return access.response;

  const contribution = await prisma.contribution.findUnique({
    where: { id },
    select: { id: true, authorId: true },
  });
  if (!contribution) return jsonError("Not found", 404);
  if (contribution.authorId === access.session.id) {
    return jsonError("Cannot add notes to your own contribution", 409);
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const note = await prisma.communityNote.create({
    data: {
      contributionId: id,
      authorId: access.session.id,
      body: parsed.data.body,
      type: parsed.data.type,
      status: "PENDING",
    },
  });

  return jsonOk({ note }, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const notes = await prisma.communityNote.findMany({
    where: { contributionId: id, status: { in: ["VISIBLE", "PENDING"] } },
    orderBy: [{ helpful: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { id: true, username: true, displayName: true } },
    },
  });

  return jsonOk({ notes });
}
