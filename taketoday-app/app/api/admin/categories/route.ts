import { NextRequest } from "next/server";
import { jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/prisma";

// GET all categories
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

// POST to create a new category
export async function POST(req: NextRequest) {
  // Check rate limit
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  try {
    const body = await req.json();
    // In a real app, we would validate the body with a schema
    // For now, we'll assume it's valid
    const { name, description, icon, displayOrder } = body;
    
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