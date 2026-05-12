// Local-only admin route — not for production use.
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { draftArticle, fetchPageText, toMDX } from "@/lib/pipeline/draftArticle";

/**
 * POST /api/admin/draft
 *
 * Body: { topic?: string; url?: string; category?: string; format?: string; region?: string }
 * Returns: { draft, mdx, publishedAt }
 *
 * Exactly one of topic or url must be provided.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  const { topic, url, category, format, region } = body as Record<string, unknown>;

  const hasTopic = topic && typeof topic === "string" && topic.trim() !== "";
  const hasUrl = url && typeof url === "string" && url.trim() !== "";

  if (!hasTopic && !hasUrl) {
    return NextResponse.json(
      { error: "Exactly one of topic or url must be provided" },
      { status: 400 },
    );
  }

  if (hasTopic && hasUrl) {
    return NextResponse.json(
      { error: "topic and url are mutually exclusive" },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  let inputText: string;
  if (hasUrl) {
    try {
      const pageText = await fetchPageText(url as string);
      inputText = `Source URL: ${url}\n\nPage content:\n${pageText}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Failed to fetch URL: ${message}` }, { status: 400 });
    }
  } else {
    inputText = `Topic: ${(topic as string).trim()}`;
  }

  const hints = {
    category: typeof category === "string" && category ? category : undefined,
    format: typeof format === "string" && format ? format : undefined,
    region: typeof region === "string" && region ? region : undefined,
  };

  let draft;
  try {
    draft = await draftArticle(client, inputText, hints);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const publishedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const mdx = toMDX(draft, publishedAt);

  return NextResponse.json({ draft, mdx, publishedAt });
}
