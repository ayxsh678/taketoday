import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";
import type { InputJsonValue } from "@prisma/client/runtime/library";

const DEFAULT_COLUMNS = [
  { id: "leads", name: "Leads", color: "#6366f1" },
  { id: "in-progress", name: "In Progress", color: "#f59e0b" },
  { id: "verified", name: "Verified", color: "#10b981" },
  { id: "needs-review", name: "Needs Review", color: "#ef4444" },
  { id: "dead-ends", name: "Dead Ends", color: "#6b7280" },
];

const createBoardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  columns: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string().optional(),
      }),
    )
    .optional(),
});

type Params = { params: Promise<{ id: string }> };

async function assertMember(investigationId: string, userId: string) {
  const m = await prisma.investigationMember.findUnique({
    where: { investigationId_userId: { investigationId, userId } },
    select: { role: true },
  });
  return m;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("investigation:join");
  if (!access.ok) return access.response;

  const member = await assertMember(id, access.session.id);
  if (!member) return jsonError("Not a member of this investigation", 403);
  if (!["LEAD", "EDITOR", "RESEARCHER"].includes(member.role)) {
    return jsonError("Insufficient role to create boards", 403);
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = createBoardSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const board = await prisma.researchBoard.create({
    data: {
      investigationId: id,
      name: parsed.data.name,
      description: parsed.data.description,
      columns: (parsed.data.columns ?? DEFAULT_COLUMNS) as InputJsonValue,
    },
    include: { _count: { select: { cards: true } } },
  });

  return jsonOk({ board }, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("investigation:view");
  if (!access.ok) return access.response;

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    select: { isPublic: true },
  });
  if (!investigation) return jsonError("Not found", 404);

  const member = await assertMember(id, access.session.id);
  if (!investigation.isPublic && !member) return jsonError("Forbidden", 403);

  const boards = await prisma.researchBoard.findMany({
    where: { investigationId: id },
    include: { _count: { select: { cards: true } } },
    orderBy: { createdAt: "asc" },
  });

  return jsonOk({ boards });
}
