import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";
import { logTransparencyEvent } from "@/lib/contributor/workflow";

const forkSchema = z.object({
  title: z.string().min(10).max(200).optional(),
  branchName: z.string().max(80).optional(),
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

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await requireContributor("contribution:fork");
  if (!access.ok) return access.response;

  const parent = await prisma.contribution.findUnique({
    where: { id },
    select: { id: true, title: true, body: true, type: true, tags: true, rootId: true, language: true },
  });
  if (!parent) return jsonError("Not found", 404);

  const body: unknown = await req.json().catch(() => null);
  const parsed = forkSchema.safeParse(body ?? {});
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const title = parsed.data.title ?? `Fork of: ${parent.title}`;
  const rootId = parent.rootId ?? parent.id;

  const fork = await prisma.contribution.create({
    data: {
      authorId: access.session.id,
      type: parent.type,
      title,
      slug: slugify(title),
      body: parent.body,
      language: parent.language,
      tags: parent.tags,
      parentId: parent.id,
      rootId,
      branchName: parsed.data.branchName,
      workflowStage: "DRAFT",
    },
  });

  // Initial version
  await prisma.contributionVersion.create({
    data: {
      contributionId: fork.id,
      versionNumber: 1,
      title,
      body: parent.body,
      commitMessage: `Forked from ${parent.id}`,
      authorId: access.session.id,
    },
  });

  await logTransparencyEvent(
    fork.id,
    "FORKED",
    access.session.id,
    "PublicUser",
    `Forked from contribution ${parent.id}`,
    { parentId: parent.id, rootId },
  );

  await logTransparencyEvent(
    parent.id,
    "FORKED",
    access.session.id,
    "PublicUser",
    `Contribution forked by ${access.session.username}`,
    { forkId: fork.id },
  );

  return jsonOk({ fork }, { status: 201 });
}
