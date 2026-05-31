import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/content/search";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  return NextResponse.json(await searchArticles(q, 8));
}
