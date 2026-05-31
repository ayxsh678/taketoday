import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { z } from "zod";
import { JobStatus, Prisma, SocialPlatform } from "@prisma/client";
import { requireAdmin } from "@/lib/admin/authz";
import { logAuditAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/prisma";

// Display name → Prisma SocialPlatform enum
// THREADS cast as SocialPlatform — added to schema, migration pending
const platformEnumMap: Record<string, SocialPlatform> = {
  X: SocialPlatform.X,
  Instagram: SocialPlatform.INSTAGRAM,
  WhatsApp: SocialPlatform.WHATSAPP,
  Telegram: SocialPlatform.TELEGRAM,
  Facebook: SocialPlatform.FACEBOOK,
  LinkedIn: SocialPlatform.LINKEDIN,
  YouTube: SocialPlatform.YOUTUBE,
  Threads: "THREADS" as SocialPlatform,
};

// Prisma SocialPlatform enum → display name
const platformDisplayMap: Record<string, string> = {
  X: "X",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
  TELEGRAM: "Telegram",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  YOUTUBE: "YouTube",
  THREADS: "Threads",
};

function mapPost(post: {
  id: string;
  platform: SocialPlatform;
  copy: string;
  status: JobStatus;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  retryCount: number;
  lastError: string | null;
  createdAt: Date;
  articleId: string | null;
}) {
  return {
    id: post.id,
    platform: platformDisplayMap[post.platform] ?? post.platform,
    copy: post.copy,
    status: post.status.toLowerCase(),
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    retryCount: post.retryCount,
    lastError: post.lastError,
    createdAt: post.createdAt.toISOString(),
    articleId: post.articleId,
  };
}

const socialSchema = z.object({
  platforms: z
    .array(z.enum(["X", "Instagram", "WhatsApp", "Telegram", "Facebook", "LinkedIn", "YouTube", "Threads"]))
    .min(1),
  copy: z.string().min(4),
  scheduledAt: z.string().datetime().optional(),
  articleId: z.string().optional(),
});

export async function GET(request: NextRequest) {

  const access = await requireAdmin("social:write");
  if (!access.ok) return access.response;

  const status = request.nextUrl.searchParams.get("status")?.toUpperCase();
  const platform = request.nextUrl.searchParams.get("platform");
  const where: Prisma.SocialPostWhereInput = {};

  if (status) where.status = status as JobStatus;
  if (platform) {
    const enumPlatform = platformEnumMap[platform];
    if (enumPlatform) where.platform = enumPlatform;
  }

  const [posts, counts] = await Promise.all([
    prisma.socialPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.socialPost.groupBy({ by: ["status"], _count: { id: true } }),
  ]);

  const statusCounts = Object.fromEntries(
    counts.map((c) => [c.status.toLowerCase(), c._count.id]),
  );

  return jsonOk({ posts: posts.map(mapPost), stats: statusCounts, total: posts.length });
}

export async function POST(req: NextRequest) {

  const access = await requireAdmin("social:write");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = socialSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const { platforms, copy, scheduledAt, articleId } = parsed.data;

  try {
    const scheduled = scheduledAt ? new Date(scheduledAt) : null;
    const status = scheduled ? JobStatus.QUEUED : JobStatus.QUEUED;

    const posts = await Promise.all(
      platforms.map((p) =>
        prisma.socialPost.create({
          data: {
            platform: platformEnumMap[p] ?? SocialPlatform.X,
            copy,
            scheduledAt: scheduled,
            status,
            articleId: articleId ?? null,
          },
        }),
      ),
    );

    await logAuditAction({
      action: "create_social_posts",
      entity: "social_post",
      entityId: posts.map((p) => p.id).join(","),
      after: { platforms, copy, scheduledAt },
    });

    return jsonOk({ posts: posts.map(mapPost) }, { status: 201 });
  } catch (error) {
    const { code } = error as { code?: string };
    if (code === "P2003") return jsonError("Invalid articleId.", 422);
    return captureApiError(error);
  }
}
