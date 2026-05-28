import { NextRequest, NextResponse } from "next/server";
import { translateText, translateContributionSummary, SUPPORTED_LANGUAGES } from "@/lib/contributor/translation";

export const dynamic = "force-dynamic";

// GET /api/translate — list supported languages
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ languages: SUPPORTED_LANGUAGES });
}

// POST /api/translate — translate text or contribution summary
// Body: { text, targetLanguage } OR { contributionId, title, summary, targetLanguages[] }
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Single text translation
  if (typeof body.text === "string" && typeof body.targetLanguage === "string") {
    const translated = await translateText(body.text, body.targetLanguage);
    if (!translated) {
      return NextResponse.json({ error: "Translation unavailable" }, { status: 503 });
    }
    return NextResponse.json({ translated, targetLanguage: body.targetLanguage });
  }

  // Contribution summary batch translation
  if (
    typeof body.contributionId === "string" &&
    typeof body.title === "string" &&
    typeof body.summary === "string" &&
    Array.isArray(body.targetLanguages)
  ) {
    const results = await translateContributionSummary(
      body.contributionId,
      body.title,
      body.summary,
      body.targetLanguages as string[],
    );
    return NextResponse.json({ translations: results });
  }

  return NextResponse.json(
    { error: "Provide { text, targetLanguage } or { contributionId, title, summary, targetLanguages }" },
    { status: 400 },
  );
}
