import { NextRequest, NextResponse } from "next/server";
import { enrichArticle } from "@/lib/pipeline/enrichArticle";
import { readRawArticle, writeEnrichedFields } from "@/lib/pipeline/articleFile";

/**
 * POST /api/enrich
 *
 * Body: { slug: string; force?: boolean }
 *
 * Generates any missing AI fields for the given article and writes them
 * back into the MDX frontmatter. Returns the enriched field values.
 *
 * Note: @google/generative-ai must be a production dependency (not devDependency)
 * for this route to work in deployed environments.
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

  const { slug, force = false } = body as { slug?: unknown; force?: unknown };

  if (!slug || typeof slug !== "string" || slug.trim() === "") {
    return NextResponse.json(
      { error: "slug is required and must be a non-empty string" },
      { status: 400 },
    );
  }

  // readRawArticle calls validateSlug internally — rejects path traversal,
  // separators, dots, and anything outside [a-z0-9-] before touching the fs.
  let raw;
  try {
    raw = await readRawArticle(slug);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isNotFound = message.startsWith("Article not found");
    const isInvalidSlug = message.startsWith("Invalid slug");
    return NextResponse.json(
      { error: message },
      { status: isNotFound ? 404 : isInvalidSlug ? 400 : 500 },
    );
  }

  let result;
  try {
    result = await enrichArticle(
      { frontmatter: raw.frontmatter, body: raw.body },
      { force: force === true },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (result.generated.length > 0) {
    try {
      await writeEnrichedFields(raw.articlePath, raw.frontmatter, raw.body, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Failed to write file: ${message}` }, { status: 500 });
    }
  }

  return NextResponse.json({
    slug,
    generated: result.generated,
    quickTake: result.quickTake,
    whyItMatters: result.whyItMatters,
    takeaways: result.takeaways,
  });
}
