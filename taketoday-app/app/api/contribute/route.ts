import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";
import { logTransparencyEvent } from "@/lib/contributor/workflow";
import { runContributionAnalysis } from "@/lib/contributor/ai-pipeline";

const createSchema = z.object({
  type: z.enum([
    "BREAKING_NEWS",
    "INVESTIGATION",
    "RESEARCH",
    "THREAD",
    "DATA_JOURNALISM",
    "DOCUMENT_LEAK",
    "PHOTO_REPORT",
    "VIDEO_REPORT",
    "EXPLAINER",
    "COMMUNITY_NOTE",
    "OPINION",
    "WHISTLEBLOWER_TIP",
  ]),
  title: z.string().min(10).max(200),
  summary: z.string().max(500).optional(),
  body: z.string().min(50).max(100_000),
  location: z.string().max(100).optional(),
  language: z.string().length(2).default("en"),
  isBreaking: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(10).default([]),
  aiUsageDisclosed: z.boolean().default(false),
  parentId: z.string().cuid().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.string().optional(),
  status: z.string().optional(),
  authorId: z.string().optional(),
});

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) +
    "-" +
    Date.now().toString(36)
  );
}

export async function POST(req: NextRequest) {
  const access = await requireContributor("contribution:create");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const data = parsed.data;
  const authorId = access.session.id;

  // Validate fork parent exists
  let rootId: string | undefined;
  if (data.parentId) {
    const parent = await prisma.contribution.findUnique({
      where: { id: data.parentId },
      select: { id: true, rootId: true },
    });
    if (!parent) return jsonError("Parent contribution not found", 404);
    rootId = parent.rootId ?? parent.id;
  }

  const slug = slugify(data.title);

  const contribution = await prisma.contribution.create({
    data: {
      authorId,
      type: data.type,
      title: data.title,
      slug,
      summary: data.summary,
      body: data.body,
      language: data.language,
      location: data.location,
      isBreaking: data.isBreaking,
      tags: data.tags,
      aiUsageDisclosed: data.aiUsageDisclosed,
      parentId: data.parentId,
      rootId,
      workflowStage: "DRAFT",
    },
  });

  // Version 1 snapshot
  await prisma.contributionVersion.create({
    data: {
      contributionId: contribution.id,
      versionNumber: 1,
      title: data.title,
      body: data.body,
      commitMessage: "Initial draft",
      authorId,
    },
  });

  await logTransparencyEvent(
    contribution.id,
    "SUBMITTED",
    authorId,
    "PublicUser",
    "Contribution created",
  );

  // Fire-and-forget AI analysis
  void runContributionAnalysis(contribution.id, data.title, data.body).catch(
    (err) => console.error("[ai-pipeline] Background analysis failed:", err),
  );

  return jsonOk({ contribution }, { status: 201 });
}

export async function GET(req: NextRequest) {
  // Public — list published contributions
  const { searchParams } = new URL(req.url);
  const query = listQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!query.success) return jsonError(query.error.message, 422);

  const { page, limit, type, status, authorId } = query.data;
  const skip = (page - 1) * limit;

  const where = {
    ...(type && { type: type as import("@prisma/client").ContributionType }),
    ...(status
      ? { workflowStage: status as import("@prisma/client").WorkflowStage }
      : { workflowStage: "PUBLISHED" as const }),
    ...(authorId && { authorId }),
  };

  const [total, contributions] = await Promise.all([
    prisma.contribution.count({ where }),
    prisma.contribution.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        slug: true,
        summary: true,
        workflowStage: true,
        isBreaking: true,
        language: true,
        location: true,
        tags: true,
        confidenceScore: true,
        publishedAt: true,
        createdAt: true,
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
        _count: {
          select: {
            communityVotes: true,
            factChecks: true,
            evidence: true,
            collaborators: true,
          },
        },
      },
    }),
  ]);

  return jsonOk({
    contributions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
