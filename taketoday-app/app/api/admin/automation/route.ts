import { NextRequest } from "next/server";
import { jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { appConfig } from "@/lib/config/app";

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
  if (rateLimit(request)) return jsonError("Rate limit exceeded. Please try again later.", 429);

  const access = await requireAdmin("dashboard:read");
  if (!access.ok) return access.response;

  const resource = request.nextUrl.searchParams.get("resource");
  if (resource === "jobs") {
    const limit = request.nextUrl.searchParams.get("limit") ?? "20";
    return proxy(`/jobs?limit=${encodeURIComponent(limit)}`);
  }
  if (resource === "sources") return proxy("/sources");
  if (resource === "health") return proxy("/health");

  return jsonError("Unsupported automation resource", 400);
}

export async function POST(request: NextRequest) {
  if (rateLimit(request)) return jsonError("Rate limit exceeded. Please try again later.", 429);

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

  return jsonError("Unsupported automation action", 400);
}
