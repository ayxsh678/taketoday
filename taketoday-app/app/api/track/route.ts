import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ArticleStatus } from "@prisma/client";

function getDevice(ua: string): string {
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function getReferrerDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const { hostname } = new URL(url);
    return hostname || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let slug: unknown;
  try {
    ({ slug } = (await req.json()) as { slug?: unknown });
  } catch {
    return NextResponse.json({}, { status: 400 });
  }

  if (!slug || typeof slug !== "string") {
    return NextResponse.json({}, { status: 400 });
  }

  const country = req.headers.get("x-vercel-ip-country");
  const referrer = getReferrerDomain(req.headers.get("referer"));
  const device = getDevice(req.headers.get("user-agent") ?? "");

  try {
    await Promise.all([
      prisma.article.updateMany({
        where: { slug, status: ArticleStatus.PUBLISHED },
        data: { views: { increment: 1 } },
      }),
      prisma.$executeRaw`
        INSERT INTO "PageView" (id, slug, referrer, country, device, at)
        VALUES (gen_random_uuid()::text, ${slug}, ${referrer}, ${country}, ${device}, now())
      `,
    ]);
  } catch {
    // non-critical — never surface tracking errors to the reader
  }

  return NextResponse.json({ ok: true });
}
