import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";

const querySchema = z.object({
  stage: z.string().optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// Editorial queue — admin-only view of all submitted contributions
export async function GET(req: NextRequest) {
  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  const { searchParams } = new URL(req.url);
  const query = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!query.success) return jsonError(query.error.message, 422);

  const { stage, type, page, limit } = query.data;
  const skip = (page - 1) * limit;

  const where = {
    status: { notIn: ["DRAFT"] as import("@prisma/client").ContributionStatus[] },
    ...(stage && { workflowStage: stage as import("@prisma/client").WorkflowStage }),
    ...(type && { type: type as import("@prisma/client").ContributionType }),
  };

  const [total, contributions] = await Promise.all([
    prisma.contribution.count({ where }),
    prisma.contribution.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isBreaking: "desc" }, { createdAt: "asc" }],
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerifiedJournalist: true,
            reputation: { select: { tier: true, overallScore: true } },
          },
        },
        aiAnalysis: {
          select: { biasScore: true, misinformationRisk: true, contentWarnings: true },
        },
        _count: {
          select: { factChecks: true, evidence: true, communityVotes: true, communityNotes: true },
        },
      },
    }),
  ]);

  return jsonOk({
    contributions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
