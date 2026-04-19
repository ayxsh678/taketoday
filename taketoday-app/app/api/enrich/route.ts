import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { enrichArticle } from "@/lib/pipeline/enrichArticle";

/**
 * POST /api/enrich
 *
 * Body: { slug: string; force?: boolean }
 *
 * Generates any missing AI fields for the given article and writes them
 * back into the MDX frontmatter. Returns the enriched field values.
 *
 * Note: @anthropic-ai/sdk must be a production dependency (not devDependency)
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

  const articlePath = path.join(
    process.cwd(),
    "content",
    "articles",
    `${slug}.mdx`,
  );

  if (!fs.existsSync(articlePath)) {
    return NextResponse.json(
      { error: `Article not found: ${slug}` },
      { status: 404 },
    );
  }

  const raw = fs.readFileSync(articlePath, "utf8");
  const file = matter(raw);

  let result;
  try {
    result = await enrichArticle(
      { frontmatter: file.data, body: file.content },
      { force: force === true },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (result.generated.length > 0) {
    const updatedData: Record<string, unknown> = {
      ...file.data,
      quickTake: result.quickTake,
      whyItMatters: result.whyItMatters,
      takeaways: Array.from(result.takeaways),
    };
    const updatedMdx = matter.stringify(file.content, updatedData);
    fs.writeFileSync(articlePath, updatedMdx, "utf8");
  }

  return NextResponse.json({
    slug,
    generated: result.generated,
    quickTake: result.quickTake,
    whyItMatters: result.whyItMatters,
    takeaways: result.takeaways,
  });
}
