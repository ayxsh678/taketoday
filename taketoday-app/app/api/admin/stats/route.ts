import { NextRequest } from "next/server";
import { jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/prisma";

// GET admin stats
export async function GET(request: Request) {
  // Check rate limit
  if (rateLimit(request)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("dashboard:read");
  if (!access.ok) return access.response;

  try {
    // In a real app, we would compute these from the database
    // For now, we'll return mock data
    const stats = {
      publishedNews: 24,
      drafts: 8,
      scheduledPosts: 5,
      pendingApprovals: 3,
      socialPostsPublished: 184,
      websiteTraffic: 31800,
      engagementCtr: 8.4,
      aiGeneratedAssets: 426,
    };

    // Calculate percentage changes (mock)
    const statsWithDelta = {
      publishedNews: { value: stats.publishedNews, delta: "+12%" },
      drafts: { value: stats.drafts, delta: "+4%" },
      scheduledPosts: { value: stats.scheduledPosts, delta: "+18%" },
      pendingApprovals: { value: stats.pendingApprovals, delta: "+2%" },
      socialPostsPublished: { value: stats.socialPostsPublished, delta: "+31%" },
      websiteTraffic: { value: stats.websiteTraffic, delta: "+9%" },
      engagementCtr: { value: stats.engagementCtr, delta: "+1.2%" },
      aiGeneratedAssets: { value: stats.aiGeneratedAssets, delta: "+44%" },
    };

    return jsonOk({ stats: statsWithDelta });
  } catch (error) {
    return jsonError("Failed to fetch stats", 500);
  }
}