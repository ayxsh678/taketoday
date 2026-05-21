import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/admin/api";
import { prisma } from "@/lib/prisma";

// GET all active categories (public endpoint)
export async function GET(request: Request) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
      },
    });
    return jsonOk({ categories });
  } catch (error) {
    return jsonError("Failed to fetch categories", 500);
  }
}