import { NextResponse } from "next/server";
import { z } from "zod";
import { adminArticles, adminUsers, notifications, trafficSeries } from "@/lib/admin/data";

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
});

export function getAdminSnapshot() {
  return {
    articles: adminArticles,
    users: adminUsers,
    notifications,
    trafficSeries,
  };
}
