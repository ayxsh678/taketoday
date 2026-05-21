import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/prisma";

// Schema for category creation
const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  icon: z.string().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
});

// Get all categories
export async function GET(request: Request) {
  // Check rate limit
  if (rateLimit(request)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return jsonOk({ categories });
  } catch (error) {
    return jsonError("Failed to fetch categories", 500);
  }
}

// Create a new category
export async function POST(req: NextRequest) {
  // Check rate limit
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    
    if (!parsed.success) {
      return jsonError(parsed.error.message, 422);
    }

    const { name, description, icon, displayOrder } = parsed.data;
    
    // Generate slug from name if not provided
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon,
        displayOrder: displayOrder ?? 0,
      },
    });

    return jsonOk({ category }, { status: 201 });
  } catch (error) {
    return jsonError("Failed to create category", 500);
  }
}

// Update a category
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check rate limit
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  try {
    const body = await req.json();
    const parsed = categorySchema.partial().safeParse(body);
    
    if (!parsed.success) {
      return jsonError(parsed.error.message, 422);
    }

    const { id } = params;
    const updateData = parsed.data;
    
    // If name is being updated, regenerate slug
    if (updateData.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return jsonOk({ category });
  } catch (error) {
    return jsonError("Failed to update category", 500);
  }
}

// Delete a category (soft delete by setting isActive to false)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check rate limit
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  try {
    const { id } = params;
    
    const category = await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    return jsonOk({ category });
  } catch (error) {
    return jsonError("Failed to delete category", 500);
  }
}