import { jsonError, jsonOk } from "@/lib/admin/api";
import { prisma } from "@/lib/prisma";

// GET all categories (public endpoint)
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
    return jsonOk({ categories });
  } catch (error) {
    return jsonError("Failed to fetch categories", 500);
  }
}
