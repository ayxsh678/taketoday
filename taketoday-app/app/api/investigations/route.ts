import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";

const createSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(2000).optional(),
  targetEntity: z.string().max(200).optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(15).default([]),
});

const listSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(["ACTIVE", "ON_HOLD", "PUBLISHED", "CLOSED", "ARCHIVED"]).optional(),
  mine: z.coerce.boolean().default(false),
});

function slugify(title: string) {
  return (
    title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80) +
    "-" + Date.now().toString(36)
  );
}

export async function POST(req: NextRequest) {
  const access = await requireContributor("investigation:create");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const investigation = await prisma.investigation.create({
    data: {
      leaderId: access.session.id,
      leaderType: "PublicUser",
      title: parsed.data.title,
      slug: slugify(parsed.data.title),
      description: parsed.data.description,
      targetEntity: parsed.data.targetEntity,
      isPublic: parsed.data.isPublic,
      tags: parsed.data.tags,
      members: {
        create: {
          userId: access.session.id,
          role: "LEAD",
        },
      },
    },
    include: {
      members: { include: { user: { select: { id: true, username: true, displayName: true } } } },
    },
  });

  return jsonOk({ investigation }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const access = await requireContributor("investigation:view");
  if (!access.ok) return access.response;

  const { searchParams } = new URL(req.url);
  const query = listSchema.safeParse(Object.fromEntries(searchParams));
  if (!query.success) return jsonError(query.error.message, 422);

  const { page, limit, status, mine } = query.data;
  const skip = (page - 1) * limit;

  const where = {
    ...(status && { status }),
    ...(mine
      ? { members: { some: { userId: access.session.id } } }
      : { OR: [{ isPublic: true }, { members: { some: { userId: access.session.id } } }] }),
  };

  const [total, investigations] = await Promise.all([
    prisma.investigation.count({ where }),
    prisma.investigation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { members: true } },
        members: {
          take: 5,
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
        },
      },
    }),
  ]);

  return jsonOk({ investigations, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
