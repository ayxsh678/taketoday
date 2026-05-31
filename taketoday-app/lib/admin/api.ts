import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

// Rate limiting moved to lib/rate-limit.ts (Upstash Redis, role-aware).
// Called inside requireAdmin() in lib/admin/authz.ts — routes no longer
// need to call rateLimit() directly. [BUG-06 / BUG-20]

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
