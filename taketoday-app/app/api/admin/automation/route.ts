import { jsonError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { z } from "zod";
import { JobStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/admin/authz";
import { appConfig } from "@/lib/config/app";
import { prisma } from "@/lib/db/prisma";
import { runContentPipeline } from "@/lib/content/generators/pipeline";
import { CONTENT_FORMATS } from "@/lib/content/generators/types";
import { getRecentContentJobs } from "@/lib/content/generators/jobTracker";

const RETRYABLE_STATUS = new Set([502, 503, 504]);

function pythonUrl(path: string) {
  if (!appConfig.pythonServiceUrl) return null;
  return new URL(path, appConfig.pythonServiceUrl).toString();
}

async function parseServiceResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text.slice(0, 500) };
  }
}

async function callPythonService(path: string, init: RequestInit = {}, retry = 0): Promise<Response> {
  const url = pythonUrl(path);
  if (!url) {
    throw new Error("Python service URL is not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), appConfig.pythonServiceTimeout);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(appConfig.internalServiceToken
          ? { Authorization: `Bearer ${appConfig.internalServiceToken}` }
          : {}),
        ...init.headers,
      },
    });

    if (RETRYABLE_STATUS.has(response.status) && retry < 2) {
      await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** retry));
      return callPythonService(path, init, retry + 1);
    }

    return response;
  } catch (error) {
    if (retry < 2) {
      await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** retry));
      return callPythonService(path, init, retry + 1);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function proxy(path: string, init?: RequestInit) {
  try {
    const response = await callPythonService(path, init);
    const payload = await parseServiceResponse(response);

    if (!response.ok) {
      const message =
        typeof payload === "object" && payload && "message" in payload
          ? String((payload as { message: unknown }).message)
          : `Python service returned ${response.status}`;
      return jsonError(message, response.status);
    }

    return jsonOk(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Python service request failed";
    return jsonError(message, message.includes("not configured") ? 503 : 502);
  }
}

export async function GET(request: NextRequest) {

  const access = await requireAdmin("dashboard:read");
  if (!access.ok) return access.response;

  const resource = request.nextUrl.searchParams.get("resource");
  if (resource === "jobs") {
    const limit = request.nextUrl.searchParams.get("limit") ?? "20";
    return proxy(`/jobs?limit=${encodeURIComponent(limit)}`);
  }
  if (resource === "sources") return proxy("/sources");
  if (resource === "health") return proxy("/health");

  // DB-sourced stats (no Python service dependency)
  if (resource === "stats") {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalToday,
        succeededToday,
        totalLast30,
        succeededLast30,
        articlesCreatedToday,
        socialPostsToday,
        videoJobsToday,
      ] = await Promise.all([
        prisma.ingestionJob.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.ingestionJob.count({
          where: { status: JobStatus.SUCCEEDED, createdAt: { gte: todayStart } },
        }),
        prisma.ingestionJob.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.ingestionJob.count({
          where: { status: JobStatus.SUCCEEDED, createdAt: { gte: thirtyDaysAgo } },
        }),
        prisma.article.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.socialPost.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.shortVideoJob.count({ where: { createdAt: { gte: todayStart } } }),
      ]);

      const successRateToday =
        totalToday === 0 ? null : Math.round((succeededToday / totalToday) * 100);
      const successRateLast30 =
        totalLast30 === 0 ? null : Math.round((succeededLast30 / totalLast30) * 100);

      return jsonOk({
        today: {
          jobs: totalToday,
          succeededJobs: succeededToday,
          articles: articlesCreatedToday,
          socialPosts: socialPostsToday,
          videoJobs: videoJobsToday,
          successRate: successRateToday,
        },
        last30: {
          jobs: totalLast30,
          succeededJobs: succeededLast30,
          successRate: successRateLast30,
        },
      });
    } catch (error) {
      return jsonError(
        error instanceof Error ? error.message : "Failed to fetch automation stats",
        500,
      );
    }
  }

  // Recent content pipeline jobs — polled by automation page live refresh
  if (resource === "content-jobs") {
    const hoursParam = request.nextUrl.searchParams.get("hours");
    const hours = hoursParam ? Math.min(72, Math.max(1, Number(hoursParam))) : 24;
    try {
      const jobs = await getRecentContentJobs(isNaN(hours) ? 24 : hours);
      return jsonOk({ jobs });
    } catch (err) {
      return jsonError(
        err instanceof Error ? err.message : "Failed to fetch content jobs",
        500,
      );
    }
  }

  return jsonError("Unsupported automation resource", 400);
}

export async function POST(request: NextRequest) {

  const access = await requireAdmin("ingestion:write");
  if (!access.ok) return access.response;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "");

  if (action === "createSource") {
    return proxy("/sources", { method: "POST", body: JSON.stringify(body.source ?? {}) });
  }
  if (action === "runFullPipeline") {
    return proxy("/trigger-pipeline", { method: "POST" });
  }
  if (action === "scrapeSources") {
    return proxy("/scrape-now", { method: "POST" });
  }
  if (action === "postEverywhere") {
    const articleId = typeof body.articleId === "string" ? body.articleId : "";
    if (!articleId) return jsonError("Missing articleId", 422);
    return proxy(`/post-everywhere/${encodeURIComponent(articleId)}`, { method: "POST" });
  }
  if (action === "generateArticle") {
    return proxy("/generate-article", { method: "POST", body: JSON.stringify(body.request ?? {}) });
  }
  if (action === "executeAutomation") {
    return proxy("/execute-automation", { method: "POST", body: JSON.stringify(body.request ?? {}) });
  }
  if (action === "cancelJob") {
    const jobId = typeof body.jobId === "string" ? body.jobId : "";
    if (!jobId) return jsonError("Missing jobId", 422);
    return proxy(`/jobs/${encodeURIComponent(jobId)}/cancel`, { method: "POST" });
  }
  if (action === "deleteSource") {
    const sourceId = typeof body.sourceId === "string" ? body.sourceId : "";
    if (!sourceId) return jsonError("Missing sourceId", 422);
    return proxy(`/sources/${encodeURIComponent(sourceId)}`, { method: "DELETE" });
  }

  // ── Multi-format content generation pipeline ──────────────────────────────
  if (action === "generateContent") {
    const schema = z.object({
      content: z.string().min(10).max(8000),
      formats: z.array(z.enum(CONTENT_FORMATS)).min(1),
      options: z
        .object({
          article: z
            .object({
              length: z.enum(["short", "medium", "long"]).optional(),
              tone: z.string().optional(),
              category: z.string().optional(),
              region: z.string().optional(),
            })
            .optional(),
          image: z
            .object({
              style: z.enum(["news", "social", "branded"]).optional(),
              aspectRatio: z.enum(["1:1", "4:5", "16:9", "9:16"]).optional(),
            })
            .optional(),
          video: z
            .object({
              type: z.enum(["reel", "explainer", "breaking"]).optional(),
              duration: z.number().int().min(15).max(300).optional(),
              voiceProvider: z.string().optional(),
              avatarProvider: z.string().optional(),
            })
            .optional(),
          carousel: z
            .object({
              format: z.enum(["instagram", "linkedin", "educational", "story"]).optional(),
              slideCount: z.number().int().min(2).max(12).optional(),
              brandName: z.string().optional(),
              ctaText: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
      articleId: z.string().optional(),
      idempotencyKey: z.string().max(128).optional(),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.message, 422);

    try {
      const pipelineResponse = await runContentPipeline(parsed.data);
      return jsonOk(pipelineResponse);
    } catch (err) {
      return jsonError(
        err instanceof Error ? err.message : "Content pipeline failed",
        500,
      );
    }
  }

  return jsonError("Unsupported automation action", 400);
}
