import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  try {
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonError("Invalid request body", 422);

    const {
      name,
      slug: explicitSlug,
      description,
      icon,
      displayOrder,
      isActive,
    } = body as {
      name?: string;
      slug?: string;
      description?: string | null;
      icon?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    };

    const updateData: {
      name?: string;
      slug?: string;
      description?: string | null;
      icon?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    } = {};

    if (name !== undefined) {
      updateData.name = name.trim();
      // Prefer explicit slug; fall back to generating one from the new name
      updateData.slug =
        explicitSlug?.trim() ||
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return jsonError("No updatable fields provided", 422);
    }

    const { id } = await params;
    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { articles: true } } },
    });

    return jsonOk({ category });
  } catch (error) {
    const { code } = error as { code?: string };
    if (code === "P2002") return jsonError("A category with that name or slug already exists.", 409);
    if (code === "P2025") return jsonError("Category not found", 404);
    return captureApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const category = await prisma.category.delete({ where: { id } });
    return jsonOk({ category });
  } catch (error) {
    const { code } = error as { code?: string };
    if (code === "P2025") return jsonError("Category not found", 404);
    // P2003 = foreign key constraint — articles still reference this category
    if (code === "P2003") return jsonError("Cannot delete: articles are still assigned to this category.", 409);
    return captureApiError(error);
  }
}
