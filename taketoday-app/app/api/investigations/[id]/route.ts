import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";

const patchSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().max(2000).optional(),
  targetEntity: z.string().max(200).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(15).optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "PUBLISHED", "CLOSED", "ARCHIVED"]).optional(),
});

type Params = { params: Promise<{ id: string }> };

async function getAccessLevel(investigationId: string, userId: string) {
  const member = await prisma.investigationMember.findUnique({
    where: { investigationId_userId: { investigationId, userId } },
    select: { role: true },
  });
  return member?.role ?? null;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("investigation:view");
  if (!access.ok) return access.response;

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true, username: true, displayName: true, avatar: true,
              reputation: { select: { tier: true } },
            },
          },
        },
      },
    },
  });

  if (!investigation) return jsonError("Not found", 404);

  const isMember = investigation.members.some((m) => m.userId === access.session.id);
  if (!investigation.isPublic && !isMember) return jsonError("Forbidden", 403);

  return jsonOk({ investigation });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("investigation:join");
  if (!access.ok) return access.response;

  const role = await getAccessLevel(id, access.session.id);
  if (!role || !["LEAD", "EDITOR"].includes(role)) {
    return jsonError("Only leads and editors can update the investigation", 403);
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const updated = await prisma.investigation.update({
    where: { id },
    data: parsed.data,
  });

  return jsonOk({ investigation: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("investigation:lead");
  if (!access.ok) return access.response;

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    select: { leaderId: true },
  });
  if (!investigation) return jsonError("Not found", 404);
  if (investigation.leaderId !== access.session.id) return jsonError("Only the lead can delete", 403);

  await prisma.investigation.delete({ where: { id } });
  return jsonOk({ message: "Deleted" });
}
