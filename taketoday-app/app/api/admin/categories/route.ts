import { NextRequest } from "next/server";
import { jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/prisma";

// GET all categories
export async function GET(
  _req: NextRequest,
) {
  // Check rate limit
  if (rateLimit(_req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    return jsonOk({ categories });
   } catch {
     return jsonError("Failed to fetch categories", 500);
   }
}

// POST to create a new category
export async function POST(
  req: NextRequest,
) {
  // Check rate limit
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  try {
    const body = await req.json();
    
    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      },
    });

    return jsonOk({ category });
   } catch {
     return jsonError("Failed to create category", 500);
   }
}
