import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";

type Params = { params: Promise<{ username: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { username } = await params;

  const user = await prisma.publicUser.findUnique({
    where: { username: username.toLowerCase() },
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
      verifiedExpertise: true,
      createdAt: true,
      reputation: {
        select: {
          tier: true,
          overallScore: true,
          publishedCount: true,
          totalContributions: true,
          factCheckAccuracy: true,
          communityTrustScore: true,
          expertiseTopics: true,
          badges: true,
        },
      },
      contributions: {
        where: { workflowStage: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 12,
        select: {
          id: true,
          type: true,
          title: true,
          slug: true,
          summary: true,
          publishedAt: true,
          tags: true,
          isBreaking: true,
          _count: { select: { communityVotes: true, factChecks: true, evidence: true } },
        },
      },
    },
  });

  if (!user) return jsonError("User not found", 404);
  if (user.reputation === null) return jsonOk({ user: { ...user, reputation: null } });

  return jsonOk({ user });
}
