import { captureApiError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  try {
    const articles = await prisma.article.findMany({
      where: { status: { in: ["PUBLISHED", "DRAFT"] } },
      select: {
        id: true,
        headline: true,
        status: true,
        featuredImage: { select: { url: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return jsonOk({ articles });
  } catch (error) {
    return captureApiError(error);
  }
}
