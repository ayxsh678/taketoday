import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";

const createCardSchema = z.object({
  boardId: z.string().cuid(),
  columnId: z.string(),
  type: z.enum([
    "LEAD", "EVIDENCE", "SOURCE", "FINDING", "QUESTION",
    "DOCUMENT", "TIMELINE_EVENT", "PERSON", "ORGANIZATION",
  ]),
  title: z.string().min(1).max(300),
  body: z.string().max(5000).optional(),
  position: z.number().int().default(0),
  assignedToId: z.string().cuid().optional(),
  contributionId: z.string().cuid().optional(),
  evidenceIds: z.array(z.string()).default([]),
  tags: z.array(z.string().max(50)).max(10).default([]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

const moveCardSchema = z.object({
  cardId: z.string().cuid(),
  targetColumnId: z.string(),
  position: z.number().int().default(0),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id: investigationId } = await params;
  const access = await requireContributor("investigation:join");
  if (!access.ok) return access.response;

  const member = await prisma.investigationMember.findUnique({
    where: { investigationId_userId: { investigationId, userId: access.session.id } },
    select: { role: true },
  });
  if (!member) return jsonError("Not a member", 403);

  const body: unknown = await req.json().catch(() => null);

  // Handle card move
  const moveParsed = moveCardSchema.safeParse(body);
  if ((body as Record<string, unknown>)?.cardId && moveParsed.success) {
    const { cardId, targetColumnId, position } = moveParsed.data;
    const updated = await prisma.researchCard.update({
      where: { id: cardId },
      data: { columnId: targetColumnId, position },
    });
    return jsonOk({ card: updated });
  }

  // Handle card create
  const parsed = createCardSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const board = await prisma.researchBoard.findUnique({
    where: { id: parsed.data.boardId },
    select: { investigationId: true },
  });
  if (!board || board.investigationId !== investigationId) {
    return jsonError("Board not found in this investigation", 404);
  }

  const card = await prisma.researchCard.create({
    data: {
      ...parsed.data,
      createdById: access.session.id,
    },
  });

  return jsonOk({ card }, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: investigationId } = await params;
  const access = await requireContributor("investigation:view");
  if (!access.ok) return access.response;

  const member = await prisma.investigationMember.findUnique({
    where: { investigationId_userId: { investigationId, userId: access.session.id } },
    select: { role: true },
  });

  const investigation = await prisma.investigation.findUnique({
    where: { id: investigationId },
    select: { isPublic: true },
  });
  if (!investigation) return jsonError("Not found", 404);
  if (!investigation.isPublic && !member) return jsonError("Forbidden", 403);

  const boards = await prisma.researchBoard.findMany({
    where: { investigationId },
    select: { id: true },
  });

  const cards = await prisma.researchCard.findMany({
    where: { boardId: { in: boards.map((b) => b.id) } },
    orderBy: [{ columnId: "asc" }, { position: "asc" }],
  });

  return jsonOk({ cards });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: investigationId } = await params;
  const access = await requireContributor("investigation:join");
  if (!access.ok) return access.response;

  const member = await prisma.investigationMember.findUnique({
    where: { investigationId_userId: { investigationId, userId: access.session.id } },
    select: { role: true },
  });
  if (!member) return jsonError("Not a member", 403);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.id) return jsonError("Card id required", 422);

  const cardId = body.id as string;
  delete body.id;

  const updated = await prisma.researchCard.update({
    where: { id: cardId },
    data: body as Parameters<typeof prisma.researchCard.update>[0]["data"],
  });

  return jsonOk({ card: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id: investigationId } = await params;
  const access = await requireContributor("investigation:join");
  if (!access.ok) return access.response;

  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId");
  if (!cardId) return jsonError("cardId required", 422);

  const member = await prisma.investigationMember.findUnique({
    where: { investigationId_userId: { investigationId, userId: access.session.id } },
    select: { role: true },
  });
  if (!member) return jsonError("Not a member", 403);

  await prisma.researchCard.delete({ where: { id: cardId } });
  return jsonOk({ message: "Deleted" });
}
