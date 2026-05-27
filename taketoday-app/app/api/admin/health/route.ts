import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { appConfig } from "@/lib/config/app";

// ─── Health check ─────────────────────────────────────────────────────────────
// Public (no auth) — used by uptime monitors, Vercel healthchecks.
// Checks DB connectivity, Python service reachability, and env configuration.

type CheckResult = { ok: boolean; latencyMs?: number; error?: string };

async function checkDatabase(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message : "DB unreachable",
    };
  }
}

async function checkPythonService(): Promise<CheckResult> {
  if (!appConfig.pythonServiceUrl) {
    return { ok: false, error: "PYTHON_SERVICE_URL not set" };
  }
  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${appConfig.pythonServiceUrl}/health`, {
      signal: controller.signal,
      headers: appConfig.internalServiceToken
        ? { Authorization: `Bearer ${appConfig.internalServiceToken}` }
        : {},
    });
    clearTimeout(timer);
    return { ok: res.ok, latencyMs: Date.now() - t0 };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message : "Service unreachable",
    };
  }
}

function checkEnv(): CheckResult {
  const missing: string[] = [];
  if (!appConfig.anthropicApiKey) missing.push("ANTHROPIC_API_KEY");
  if (!appConfig.databaseUrl) missing.push("DATABASE_URL");
  if (!appConfig.nextauthSecret) missing.push("NEXTAUTH_SECRET");
  return missing.length === 0
    ? { ok: true }
    : { ok: false, error: `Missing env vars: ${missing.join(", ")}` };
}

export async function GET(req: NextRequest) {
  // Allow secret-gated detailed view; bare /health returns minimal response
  const token = req.nextUrl.searchParams.get("token");
  const isDetailed =
    token && appConfig.internalServiceToken && token === appConfig.internalServiceToken;

  const [db, python] = await Promise.all([checkDatabase(), checkPythonService()]);
  const env = checkEnv();

  const allOk = db.ok && env.ok; // Python service optional (not always deployed)

  const status = allOk ? 200 : 503;

  if (!isDetailed) {
    // Minimal response for public uptime monitors
    return NextResponse.json(
      { status: allOk ? "ok" : "degraded", db: db.ok, env: env.ok, python: python.ok },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Detailed response for authenticated callers
  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      checks: {
        database: db,
        pythonService: python,
        environment: env,
      },
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
      timestamp: new Date().toISOString(),
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
