import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { adminArticles, adminUsers, notifications, trafficSeries } from "@/lib/admin/data";

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Role-based tiers: higher-trust roles get higher limits.

const requestCounts = new Map<string, number[]>();
const WINDOW_MS = 60 * 1000; // 1 minute

const RATE_LIMIT_BY_ROLE: Record<string, number> = {
  // Display name keys (matches session.user.role from auth.ts)
  "Super Admin": 600,
  Editor: 300,
  "Content Manager": 200,
  "Social Media Manager": 120,
  Analyst: 60,
  // Prisma enum keys (matches x-admin-role header set by middleware)
  SUPER_ADMIN: 600,
  EDITOR: 300,
  CONTENT_MANAGER: 200,
  SOCIAL_MEDIA_MANAGER: 120,
};

const DEFAULT_RATE_LIMIT = 60;

export function rateLimit(request: NextRequest, userId?: string, role?: string) {
  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "anonymous";
  const key = userId ?? ip;
  const maxRequests = role
    ? (RATE_LIMIT_BY_ROLE[role] ?? DEFAULT_RATE_LIMIT)
    : DEFAULT_RATE_LIMIT;
  const now = Date.now();

  const prev = requestCounts.get(key) ?? [];
  const valid = prev.filter((t) => now - t < WINDOW_MS);

  if (valid.length >= maxRequests) {
    return true; // rate limited
  }

  valid.push(now);
  requestCounts.set(key, valid);
  return false;
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/**
 * Capture an unexpected error to Sentry and return a 500 response.
 * Drop-in replacement for `jsonError(msg, 500)` inside catch blocks.
 */
export function captureApiError(
  err: unknown,
  context?: Record<string, unknown>,
): ReturnType<typeof jsonError> {
  const message = err instanceof Error ? err.message : "Internal server error";
  try {
    Sentry.captureException(err, { extra: context });
  } catch {
    // Sentry not configured — fallback to structured stderr
    process.stderr.write(
      JSON.stringify({ level: "error", message, context, ts: new Date().toISOString() }) + "\n",
    );
  }
  return jsonError(message, 500);
}

export const articleMutationSchema = z.object({
  headline: z.string().min(8),
  subheadline: z.string().min(12),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  category: z.string().min(2),
  author: z.string().min(2),
  status: z.enum(["draft", "under_review", "approved", "scheduled", "published", "archived"]),
  priorityScore: z.number().int().min(0).max(100),
  tags: z.array(z.string()).default([]),
  body: z.string().optional(),
});

export function getAdminSnapshot() {
  return {
    articles: adminArticles,
    users: adminUsers,
    notifications,
    trafficSeries,
  };
}

// Full create schema — used for POST /api/admin/articles
// Replaces the legacy articleMutationSchema which included unused `author`/`category` string fields.
export const articleCreateSchema = z.object({
  headline: z.string().min(8),
  subheadline: z.string().min(12),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  body: z.string().default(""),
  status: z
    .enum(["draft", "under_review", "approved", "scheduled", "published", "archived"])
    .default("draft"),
  categoryId: z.string().optional(),
  priorityScore: z.number().int().min(0).max(100).default(50),
  breaking: z.boolean().default(false),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  tags: z.array(z.string()).default([]),
  language: z.string().default("en"),
  location: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

// Partial update schema — used for PUT /api/admin/articles/[id]
// All fields optional; validates only what's provided.
export const articlePatchSchema = z.object({
  headline: z.string().min(8).optional(),
  subheadline: z.string().min(12).optional(),
  body: z.string().optional(),
  status: z.enum(["draft", "under_review", "approved", "scheduled", "published", "archived"]).optional(),
  priorityScore: z.number().int().min(0).max(100).optional(),
  breaking: z.boolean().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});
