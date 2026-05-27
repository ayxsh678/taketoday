import { NextRequest } from "next/server";
import { captureApiError, jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

export async function GET(_req: NextRequest) {
  if (rateLimit(_req)) return jsonError("Rate limit exceeded. Please try again later.", 429);

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  try {
    // Single query — includes article count via join table to avoid N+1
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        _count: { select: { articles: true } },
      },
    });

    return jsonOk({ categories });
  } catch (error) {
    return captureApiError(error);
  }
}

export async function POST(req: NextRequest) {
  if (rateLimit(req)) return jsonError("Rate limit exceeded. Please try again later.", 429);

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  try {
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || !("name" in body) || typeof (body as { name: unknown }).name !== "string") {
      return jsonError("name is required", 422);
    }

    const { name, slug } = body as { name: string; slug?: string };
    if (!name.trim()) return jsonError("name cannot be blank", 422);

    const resolvedSlug =
      slug?.trim() ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const category = await prisma.category.create({
      data: { name: name.trim(), slug: resolvedSlug },
      include: { _count: { select: { articles: true } } },
    });

    return jsonOk({ category }, { status: 201 });
  } catch (error) {
    const { code } = error as { code?: string };
    if (code === "P2002") return jsonError("A category with that name or slug already exists.", 409);
    return captureApiError(error);
  }
}
