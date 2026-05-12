// Local-only admin route — not for production use.
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { validateSlug } from "@/lib/pipeline/articleFile";

/**
 * POST /api/admin/save
 *
 * Body: { slug: string; mdx: string }
 *
 * Writes MDX to content/articles/[slug].mdx.
 * Returns 409 if the file already exists.
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

  const { slug, mdx } = body as Record<string, unknown>;

  if (!slug || typeof slug !== "string" || slug.trim() === "") {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  if (!mdx || typeof mdx !== "string" || mdx.trim() === "") {
    return NextResponse.json({ error: "mdx is required" }, { status: 400 });
  }

  try {
    validateSlug(slug);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const outPath = path.join(process.cwd(), "content", "articles", `${slug}.mdx`);

  try {
    await fs.access(outPath);
    return NextResponse.json(
      { error: `File already exists: content/articles/${slug}.mdx` },
      { status: 409 },
    );
  } catch {
    // File doesn't exist — safe to write
  }

  try {
    await fs.writeFile(outPath, mdx, "utf8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to write file: ${message}` }, { status: 500 });
  }

  return NextResponse.json({ slug, path: `content/articles/${slug}.mdx` });
}
