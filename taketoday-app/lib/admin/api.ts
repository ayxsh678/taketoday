import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { adminArticles, adminUsers, notifications, trafficSeries } from "@/lib/admin/data";

// Rate limiting
const requestCounts = new Map<string, number[]>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60;

export function rateLimit(request: NextRequest, userId?: string) {
  // Use userId if available, otherwise use IP
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'anonymous';
  const key = userId ?? ip ?? 'anonymous';
  const now = Date.now();

  if (!requestCounts.has(key)) {
    requestCounts.set(key, []);
  }

  const timestamps = requestCounts.get(key)!;
  // Remove timestamps outside the window
  const validTimestamps = timestamps.filter((t) => now - t < WINDOW_MS);
  requestCounts.set(key, validTimestamps);

  if (validTimestamps.length >= MAX_REQUESTS) {
    return true; // Rate limit exceeded
  }

  validTimestamps.push(now);
  requestCounts.set(key, validTimestamps);
  return false;
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
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
