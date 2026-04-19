#!/usr/bin/env tsx
/**
 * TakeToday — Article Enrichment CLI
 *
 * Reads an existing MDX article and generates any missing AI fields
 * (quickTake, whyItMatters, takeaways), then writes them back into
 * the frontmatter. Requires ANTHROPIC_API_KEY in the environment.
 *
 * Usage:
 *   npx tsx scripts/enrich-article.ts <slug>
 *   npx tsx scripts/enrich-article.ts --slug <slug>
 *   npx tsx scripts/enrich-article.ts <slug> --force   (regenerate all fields)
 */

import { enrichArticle } from "../lib/pipeline/enrichArticle";
import { readRawArticle, writeEnrichedFields } from "../lib/pipeline/articleFile";
import type { EnrichableField, EnrichmentResult } from "../lib/pipeline/enrichArticle";

// ─── Args ─────────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): { slug: string | undefined; force: boolean } {
  const args = argv.slice(2);
  const flagIdx = args.indexOf("--slug");
  const slug =
    flagIdx !== -1 && flagIdx + 1 < args.length
      ? args[flagIdx + 1]
      : args.find((a) => !a.startsWith("--"));
  return { slug, force: args.includes("--force") };
}

// ─── Logging helpers ──────────────────────────────────────────────────────────

function log(msg: string) {
  process.stdout.write(msg + "\n");
}

function logField(field: EnrichableField, result: EnrichmentResult) {
  if (field === "takeaways") {
    log("  takeaways:");
    result.takeaways.forEach((t, i) => log(`    ${i + 1}. ${t}`));
  } else {
    log(`  ${field}: ${result[field]}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { slug, force } = parseArgs(process.argv);

  if (!slug) {
    console.error(
      "Usage: npx tsx scripts/enrich-article.ts <slug> [--force]\n" +
        "       npx tsx scripts/enrich-article.ts --slug <slug> [--force]",
    );
    process.exit(1);
  }

  log(`\nArticle:  ${slug}`);
  if (force) log("Mode:     --force (regenerating all fields)");

  let raw;
  try {
    raw = await readRawArticle(slug);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  log("Checking fields…");

  let result;
  try {
    result = await enrichArticle(
      { frontmatter: raw.frontmatter, body: raw.body },
      { force },
    );
  } catch (err) {
    console.error(
      "\nEnrichment failed:",
      err instanceof Error ? err.message : String(err),
    );
    process.exit(1);
  }

  if (result.generated.length === 0) {
    log("All fields are already present. Use --force to regenerate.");
    return;
  }

  log(`Generating: ${result.generated.join(", ")}`);

  try {
    await writeEnrichedFields(raw.articlePath, raw.frontmatter, raw.body, result);
  } catch (err) {
    console.error(
      "\nFailed to write file:",
      err instanceof Error ? err.message : String(err),
    );
    process.exit(1);
  }

  log("\nGenerated fields:");
  for (const field of result.generated) {
    logField(field, result);
  }

  log(`\nWritten:  content/articles/${slug}.mdx`);
  log("Done.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
