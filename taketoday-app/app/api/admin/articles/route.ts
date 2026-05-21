import { NextRequest } from "next/server";
import { articleMutationSchema, getAdminSnapshot, jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { logAuditAction } from "@/lib/admin/audit";

export async function GET(req: NextRequest) {
  // Check rate limit
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  const q = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";
  const status = req.nextUrl.searchParams.get("status");
  const articles = getAdminSnapshot().articles.filter((article) => {
    const matchesSearch =
      q.length === 0 ||
      article.headline.toLowerCase().includes(q) ||
      article.tags.some((tag) => tag.toLowerCase().includes(q));
    const matchesStatus = !status || article.status === status;
    return matchesSearch && matchesStatus;
  });

  return jsonOk({ articles, total: articles.length, page: 1, pageSize: 25 });
}

export async function POST(req: NextRequest) {
  // Check rate limit
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  const body: unknown = await req.json();
  const parsed = articleMutationSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const articleData = parsed.data;
  
  // Log the audit action
  await logAuditAction({
    action: "create_article",
    entity: "article",
    entityId: `art_${Date.now()}`, // Temporary ID
    after: articleData,
  });

  return jsonOk(
    {
      article: {
        id: `art_${Date.now()}`,
        ...articleData,
      },
    },
    { status: 201 },
  );
}
