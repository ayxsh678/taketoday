import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";

const addMemberSchema = z.object({
  username: z.string().min(1),
  role: z.enum(["RESEARCHER", "FACT_CHECKER", "EDITOR", "VIEWER"]).default("RESEARCHER"),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("investigation:join");
  if (!access.ok) return access.response;

  // Only LEAD or EDITOR can invite
  const requester = await prisma.investigationMember.findUnique({
    where: { investigationId_userId: { investigationId: id, userId: access.session.id } },
    select: { role: true },
  });
  if (!requester || !["LEAD", "EDITOR"].includes(requester.role)) {
    return jsonError("Only leads and editors can invite members", 403);
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const user = await prisma.publicUser.findUnique({
    where: { username: parsed.data.username.toLowerCase() },
    select: { id: true, username: true, displayName: true },
  });
  if (!user) return jsonError("User not found", 404);

  // Upsert — prevents duplicate membership
  const member = await prisma.investigationMember.upsert({
    where: { investigationId_userId: { investigationId: id, userId: user.id } },
    create: { investigationId: id, userId: user.id, role: parsed.data.role },
    update: { role: parsed.data.role },
  });

  return jsonOk({ member: { ...member, user } }, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("investigation:view");
  if (!access.ok) return access.response;

  const members = await prisma.investigationMember.findMany({
    where: { investigationId: id },
    include: {
      user: {
        select: {
          id: true, username: true, displayName: true, avatar: true,
          isVerifiedJournalist: true,
          reputation: { select: { tier: true, overallScore: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return jsonOk({ members });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("investigation:join");
  if (!access.ok) return access.response;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return jsonError("userId required", 422);

  const requester = await prisma.investigationMember.findUnique({
    where: { investigationId_userId: { investigationId: id, userId: access.session.id } },
    select: { role: true },
  });

  const isSelf = userId === access.session.id;
  const isLead = requester?.role === "LEAD";

  if (!isSelf && !isLead) return jsonError("Only leads can remove others", 403);
  if (isLead && userId === access.session.id) return jsonError("Lead cannot leave — transfer lead first", 409);

  await prisma.investigationMember.delete({
    where: { investigationId_userId: { investigationId: id, userId } },
  });

  return jsonOk({ message: "Removed" });
}
