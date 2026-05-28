import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/authz";
import { getTrustFlags, resolveFlag, analyzeContributorRisk } from "@/lib/contributor/trust-safety";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolved = req.nextUrl.searchParams.get("resolved");
  const userId = req.nextUrl.searchParams.get("userId") ?? undefined;
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "50"), 200);

  const flags = await getTrustFlags({
    userId,
    resolved: resolved === "true" ? true : resolved === "false" ? false : undefined,
    limit,
  });

  return NextResponse.json({ flags, count: flags.length });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { flagId?: string; userId?: string };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (body.flagId) {
    await resolveFlag(body.flagId, auth.session.user?.id ?? "admin");
    return NextResponse.json({ ok: true });
  }

  if (body.userId) {
    const analysis = await analyzeContributorRisk(body.userId);
    return NextResponse.json(analysis);
  }

  return NextResponse.json({ error: "flagId or userId required" }, { status: 400 });
}
