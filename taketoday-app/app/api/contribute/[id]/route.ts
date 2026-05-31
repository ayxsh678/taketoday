import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";
import { canEditContribution } from "@/lib/contributor/rbac";
import { logTransparencyEvent, transitionWorkflow } from "@/lib/contributor/workflow";
import { runContributionAnalysis } from "@/lib/contributor/ai-pipeline";

const updateSchema = z.object({
  title: z.string().min(10).max(200).optional(),
  summary: z.string().max(500).optional(),
  body: z.string().min(50).max(100_000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  location: z.string().max(100).optional(),
  isBreaking: z.boolean().optional(),
  aiUsageDisclosed: z.boolean().optional(),
  commitMessage: z.string().max(200).optional(),
});

const submitSchema = z.object({
  action: z.literal("submit"),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const contribution = await prisma.contribution.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isVerifiedJournalist: true,
          reputation: { select: { tier: true, overallScore: true, expertiseTopics: true } },
        },
      },
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 10,
        select: {
          id: true,
          versionNumber: true,
          commitMessage: true,
          authorId: true,
          createdAt: true,
        },
      },
      collaborators: {
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
        },
      },
      evidence: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          submittedBy: { select: { id: true, username: true, displayName: true } },
        },
      },
      citations: { orderBy: { accessedAt: "desc" }, take: 20 },
      factChecks: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          checker: { select: { id: true, username: true, displayName: true, isVerifiedJournalist: true } },
        },
      },
      communityNotes: {
        where: { status: "VISIBLE" },
        orderBy: { helpful: "desc" },
        take: 10,
        include: {
          author: { select: { id: true, username: true, displayName: true } },
        },
      },
      transparencyLogs: {
        orderBy: { createdAt: "asc" },
        take: 50,
      },
      aiAnalysis: true,
      editorialDecisions: {
        where: { publiclyVisible: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      corrections: { orderBy: { createdAt: "desc" }, take: 10 },
      forks: {
        select: {
          id: true,
          title: true,
          slug: true,
          author: { select: { username: true, displayName: true } },
          createdAt: true,
        },
        take: 10,
      },
    },
  });

  if (!contribution) return jsonError("Contribution not found", 404);

  // Aggregate community vote summary via groupBy — avoids loading every row [BUG-16]
  const voteGroups = await prisma.communityVote.groupBy({
    by: ["type"],
    where: { contributionId: id },
    _sum: { weight: true },
  });
  const voteSummary = Object.fromEntries(
    voteGroups.map((g) => [g.type, g._sum.weight ?? 0]),
  );

  return jsonOk({ contribution: { ...contribution, voteSummary } });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("contribution:edit:own");
  if (!access.ok) return access.response;

  const contribution = await prisma.contribution.findUnique({
    where: { id },
    select: { id: true, authorId: true, workflowStage: true, body: true, title: true },
  });
  if (!contribution) return jsonError("Contribution not found", 404);

  if (!canEditContribution(access.session.role, contribution.authorId, access.session.id)) {
    return jsonError("Forbidden", 403);
  }

  if (!["DRAFT", "SUBMITTED"].includes(contribution.workflowStage)) {
    return jsonError("Cannot edit a contribution in this stage", 409);
  }

  const body: unknown = await req.json().catch(() => null);

  // Handle workflow action (submit)
  const submitParsed = submitSchema.safeParse(body);
  if (submitParsed.success) {
    const result = await transitionWorkflow({
      contributionId: id,
      from: contribution.workflowStage,
      to: "SUBMITTED",
      actorId: access.session.id,
      actorType: "PublicUser",
      reason: "Contributor submitted for editorial review",
    });
    if (!result.ok) return jsonError(result.error, 409);
    return jsonOk({ message: "Submitted for review" });
  }

  // Handle content update
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const data = parsed.data;
  if (!Object.keys(data).length) return jsonError("No fields to update", 422);

  const updated = await prisma.contribution.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.summary !== undefined && { summary: data.summary }),
      ...(data.body && { body: data.body }),
      ...(data.tags && { tags: data.tags }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.isBreaking !== undefined && { isBreaking: data.isBreaking }),
      ...(data.aiUsageDisclosed !== undefined && { aiUsageDisclosed: data.aiUsageDisclosed }),
    },
  });

  // Create a new version snapshot if body changed
  if (data.body) {
    const lastVersion = await prisma.contributionVersion.findFirst({
      where: { contributionId: id },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    await prisma.contributionVersion.create({
      data: {
        contributionId: id,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        title: data.title ?? contribution.title,
        body: data.body,
        commitMessage: data.commitMessage ?? "Updated",
        authorId: access.session.id,
      },
    });

    await logTransparencyEvent(
      id,
      "VERSION_CREATED",
      access.session.id,
      "PublicUser",
      data.commitMessage ?? "Content updated",
    );

    // Re-run AI analysis on body changes
    void runContributionAnalysis(
      id,
      data.title ?? contribution.title,
      data.body,
    ).catch(() => {});
  } else {
    await logTransparencyEvent(id, "EDITED", access.session.id, "PublicUser", "Metadata updated");
  }

  return jsonOk({ contribution: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("contribution:edit:own");
  if (!access.ok) return access.response;

  const contribution = await prisma.contribution.findUnique({
    where: { id },
    select: { authorId: true, workflowStage: true },
  });
  if (!contribution) return jsonError("Not found", 404);

  if (contribution.authorId !== access.session.id) {
    return jsonError("Forbidden", 403);
  }

  if (contribution.workflowStage !== "DRAFT") {
    return jsonError("Only draft contributions can be deleted", 409);
  }

  await prisma.contribution.delete({ where: { id } });
  return jsonOk({ message: "Deleted" });
}
