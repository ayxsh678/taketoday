import { NextRequest } from "next/server";
import { z } from "zod";
import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { appConfig } from "@/lib/config/app";
import { prisma } from "@/lib/db/prisma";
import type { PostPlatform, PostStatus } from "@prisma/client";

const VALID_PLATFORMS: PostPlatform[] = ["INSTAGRAM", "TWITTER", "LINKEDIN", "WHATSAPP"];

const schema = z.object({
  draftId: z.string().optional(),
  platforms: z.array(z.enum(["INSTAGRAM", "TWITTER", "LINKEDIN", "WHATSAPP"])).min(1),
  content: z.string().min(1),
  mediaUrls: z.array(z.string().url()).default([]),
  scheduledAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  const access = await requireAdmin("social:write");
  if (!access.ok) return access.response;

  const raw: unknown = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const { draftId, platforms, content, mediaUrls, scheduledAt } = parsed.data;

  if (scheduledAt) {
    const rows = await Promise.all(
      platforms.map((platform) =>
        prisma.scheduledPost.create({
          data: {
            draftId: draftId ?? undefined,
            platform: platform as PostPlatform,
            content,
            mediaUrls,
            scheduledAt: new Date(scheduledAt),
            status: "PENDING",
          },
        }),
      ),
    );
    return jsonOk({ scheduled: rows.map((r) => r.id) });
  }

  // Post immediately via Python service
  const pythonUrl = appConfig.pythonServiceUrl;
  if (!pythonUrl) {
    return jsonError("PYTHON_SERVICE_URL not configured — cannot post immediately", 503);
  }

  try {
    const resp = await fetch(`${pythonUrl}/api/v1/studio/post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${appConfig.internalServiceToken}`,
      },
      body: JSON.stringify({ platforms, content, media_urls: mediaUrls }),
      signal: AbortSignal.timeout(appConfig.pythonServiceTimeout),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return jsonError(`Python service error: ${err}`, 502);
    }

    const result = (await resp.json()) as { ok: boolean; results: Record<string, unknown> };

    // Persist posted records
    await Promise.all(
      platforms.map((platform) => {
        const platformResult = result.results[platform] as { success: boolean; post_id?: string; error?: string };
        return prisma.scheduledPost.create({
          data: {
            draftId: draftId ?? undefined,
            platform: platform as PostPlatform,
            content,
            mediaUrls,
            scheduledAt: null,
            status: platformResult.success ? "POSTED" : "FAILED",
            platformPostId: platformResult.post_id ?? null,
            errorMessage: platformResult.error ?? null,
            postedAt: platformResult.success ? new Date() : null,
          },
        });
      }),
    );

    return jsonOk(result.results);
  } catch (error) {
    return captureApiError(error, { platforms, content });
  }
}

export async function GET(req: NextRequest) {
  void VALID_PLATFORMS; // silence unused import warning
  const access = await requireAdmin("social:write");
  if (!access.ok) return access.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const platform = url.searchParams.get("platform") ?? undefined;

  try {
    const posts = await prisma.scheduledPost.findMany({
      where: {
        ...(status ? { status: status as PostStatus } : {}),
        ...(platform ? { platform: platform as PostPlatform } : {}),
      },
      include: { draft: { select: { topic: true, type: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk({ posts });
  } catch (error) {
    return captureApiError(error);
  }
}
