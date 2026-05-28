import { NextRequest, NextResponse } from "next/server";
import { semanticSearch } from "@/lib/contributor/embeddings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "20"), 50);
  const threshold = Number(req.nextUrl.searchParams.get("threshold") ?? "0.55");
  const status = req.nextUrl.searchParams.get("status") ?? undefined;

  if (!q) return NextResponse.json({ error: "q required" }, { status: 400 });

  const results = await semanticSearch(q, { limit, threshold, statusFilter: status });
  return NextResponse.json({ results, query: q, count: results.length });
}
