import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { getOrCreateAdminUser } from "@/lib/admin/current-user";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const sourceCreateSchema = z.object({
  url: z.string().url().optional(),
  title: z.string().max(255).optional(),
  note: z.string().max(500).optional(),
});

function extractDomain(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const sources = await prisma.articleSource.findMany({
      where: { articleId: id },
      orderBy: { createdAt: "asc" },
    });
    return jsonOk({ sources });
  } catch (error) {
    return captureApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = sourceCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  try {
    const { id } = await params;
    const article = await prisma.article.findUnique({ where: { id }, select: { id: true } });
    if (!article) return jsonError("Article not found", 404);

    const user = await getOrCreateAdminUser(access.session);

    const source = await prisma.articleSource.create({
      data: {
        articleId: id,
        url: parsed.data.url ?? null,
        title: parsed.data.title ?? null,
        domain: extractDomain(parsed.data.url),
        note: parsed.data.note ?? null,
        addedById: user.id,
      },
    });

    return jsonOk({ source }, { status: 201 });
  } catch (error) {
    return captureApiError(error);
  }
}
