import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(60).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().max(200).optional().or(z.literal("")),
  twitterHandle: z.string().max(50).optional(),
  linkedinUrl: z.string().url().max(200).optional().or(z.literal("")),
});

export async function GET() {
  const access = await requireContributor();
  if (!access.ok) return access.response;

  const user = await prisma.publicUser.findUnique({
    where: { id: access.session.id },
    include: {
      reputation: true,
      contributions: {
        where: { workflowStage: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          title: true,
          slug: true,
          publishedAt: true,
          _count: { select: { communityVotes: true, factChecks: true } },
        },
      },
    },
  });

  if (!user) return jsonError("User not found", 404);

  const { passwordHash, ...safeUser } = user;
  void passwordHash;

  return jsonOk({ user: safeUser });
}

export async function PATCH(req: NextRequest) {
  const access = await requireContributor("profile:edit:own");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const data = parsed.data;
  if (!Object.keys(data).length) return jsonError("No fields to update", 422);

  const updated = await prisma.publicUser.update({
    where: { id: access.session.id },
    data,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      bio: true,
      location: true,
      website: true,
      twitterHandle: true,
      linkedinUrl: true,
      role: true,
      isVerifiedJournalist: true,
      updatedAt: true,
    },
  });

  return jsonOk({ user: updated });
}
