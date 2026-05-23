import { NextRequest } from "next/server";
import { jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH to update a category
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  // Check rate limit
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  try {
    const body = await req.json();
    
    // Build update data object with proper typing based on Category model
    const updateData: {
      name?: string;
      slug?: string;
      description?: string | null;
      icon?: string | null;
      displayOrder?: number;
    } = {};
    
    if (body.name !== undefined) {
      updateData.name = body.name;
      // Generate slug from name if name is being updated
      updateData.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
    
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    
    if (body.icon !== undefined) {
      updateData.icon = body.icon;
    }
    
    if (body.displayOrder !== undefined) {
      updateData.displayOrder = body.displayOrder;
    }

    const { id } = await params;
    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return jsonOk({ category });
   } catch {
     return jsonError("Failed to update category", 500);
   }
}

  // DELETE a category
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  // Check rate limit
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const category = await prisma.category.delete({
      where: { id },
    });

    return jsonOk({ category });
   } catch {
     return jsonError("Failed to delete category", 500);
   }
}
