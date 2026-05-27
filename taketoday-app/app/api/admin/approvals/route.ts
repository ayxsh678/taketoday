import { NextRequest } from "next/server";
import { z } from "zod";
import { ArticleStatus } from "@prisma/client";
import { jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { logAuditAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/authz";
import { getOrCreateAdminUser } from "@/lib/admin/current-user";
import { prisma } from "@/lib/db/prisma";

const approvalSchema = z.object({
  articleId: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  comment: z.string().optional(),
});

const articleInclude = {
  author: true,
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  reviewComments: {
    include: { author: true },
    orderBy: { createdAt: "desc" as const },
    take: 5,
  },
} as const;

function mapArticle(a: {
  id: string;
  headline: string;
  subheadline: string;
  slug: string;
  status: ArticleStatus;
  breaking: boolean;
  priorityScore: number;
  createdAt: Date;
  updatedAt: Date;
  author: { name: string; email: string };
  categories: { category: { name: string } }[];
  tags: { tag: { name: string } }[];
  reviewComments: {
    id: string;
    body: string;
    resolved: boolean;
    createdAt: Date;
    author: { name: string };
  }[];
}) {
  return {
    id: a.id,
    headline: a.headline,
    subheadline: a.subheadline,
    slug: a.slug,
    status: a.status.toLowerCase(),
    breaking: a.breaking,
    priorityScore: a.priorityScore,
    author: a.author.name,
    authorEmail: a.author.email,
    category: a.categories[0]?.category.name ?? "Uncategorized",
    tags: a.tags.map((t) => t.tag.name),
    recentComments: a.reviewComments.map((c) => ({
      id: c.id,
      body: c.body,
      resolved: c.resolved,
      author: c.author.name,
      createdAt: c.createdAt.toISOString(),
    })),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  if (rateLimit(request)) return jsonError("Rate limit exceeded. Please try again later.", 429);

  const access = await requireAdmin("content:publish");
  if (!access.ok) return access.response;

  const [pending, recentlyProcessed] = await Promise.all([
    prisma.article.findMany({
      where: { status: ArticleStatus.UNDER_REVIEW },
      include: articleInclude,
      orderBy: { updatedAt: "asc" }, // oldest first — review queue order
    }),
    prisma.article.findMany({
      where: { status: { in: [ArticleStatus.APPROVED, ArticleStatus.DRAFT] } },
      include: articleInclude,
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  return jsonOk({
    pending: pending.map(mapArticle),
    recentlyProcessed: recentlyProcessed.map(mapArticle),
    pendingCount: pending.length,
  });
}

export async function POST(req: NextRequest) {
  if (rateLimit(req)) return jsonError("Rate limit exceeded. Please try again later.", 429);

  const access = await requireAdmin("content:publish");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = approvalSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const { articleId, decision, comment } = parsed.data;

  const article = await prisma.article.findUnique({
    where: { id: articleId },
  });
  if (!article) return jsonError("Article not found", 404);
  if (article.status !== ArticleStatus.UNDER_REVIEW) {
    return jsonError("Article is not under review", 422);
  }

  const reviewer = await getOrCreateAdminUser(access.session);
  const newStatus = decision === "approve" ? ArticleStatus.APPROVED : ArticleStatus.DRAFT;

  try {
    const [updated] = await prisma.$transaction(async (tx) => {
      const updatedArticle = await tx.article.update({
        where: { id: articleId },
        data: { status: newStatus },
        include: articleInclude,
      });

      if (comment?.trim()) {
        await tx.reviewComment.create({
          data: {
            articleId,
            authorId: reviewer.id,
            body: comment.trim(),
            resolved: decision === "approve",
          },
        });
      }

      return [updatedArticle];
    });

    await logAuditAction({
      action: decision === "approve" ? "approve_article" : "reject_article",
      entity: "article",
      entityId: articleId,
      before: { status: article.status },
      after: { status: newStatus, comment },
    });

    return jsonOk({ article: mapArticle(updated) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Decision failed", 500);
  }
}
