/**
 * scripts/migrate-mdx-to-db.ts
 *
 * One-shot migration: reads all MDX articles from content/articles/ and
 * upserts them into the Article table with status=PUBLISHED.
 *
 * Run once after deploying the 20260601000001_article_public_fields migration:
 *   npx tsx scripts/migrate-mdx-to-db.ts
 *
 * Safe to re-run — uses upsert(slug). Existing records are updated in-place.
 */

import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { PrismaClient, AdminRole, ArticleStatus } from "@prisma/client";

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, "..", "content", "articles");
const NEWSROOM_EMAIL = "newsroom@taketoday.com";

async function main() {
  // Ensure the newsroom author exists
  const author = await prisma.adminUser.upsert({
    where: { email: NEWSROOM_EMAIL },
    create: {
      name: "TakeToday Newsroom",
      email: NEWSROOM_EMAIL,
      role: AdminRole.CONTENT_MANAGER,
    },
    update: { name: "TakeToday Newsroom" },
  });
  console.log(`Author: ${author.name} (${author.id})`);

  const files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith(".mdx"));
  console.log(`Found ${files.length} MDX files`);

  let created = 0;
  let updated = 0;

  for (const file of files) {
    const raw = await readFile(join(CONTENT_DIR, file), "utf-8");
    const { data: fm, content: body } = matter(raw);

    const slug: string = fm.slug ?? file.replace(".mdx", "");
    const headline: string = fm.title ?? slug;
    const subheadline: string = fm.deck ?? "";
    const categoryName: string = fm.category ?? "AI";
    const format: string = fm.format ?? "Article";
    const region: string = fm.region ?? "GLOBAL";
    const publishedAt: Date = fm.publishedAt ? new Date(fm.publishedAt as string) : new Date();
    const quickTake: string = fm.quickTake ?? "";
    const whyItMatters: string = fm.whyItMatters ?? "";
    const takeaways: string[] = Array.isArray(fm.takeaways) ? (fm.takeaways as string[]) : [];

    // Upsert category
    const category = await prisma.category.upsert({
      where: { slug: categoryName.toLowerCase() },
      create: {
        name: categoryName,
        slug: categoryName.toLowerCase(),
        isActive: true,
      },
      update: {},
    });

    // Upsert article
    const existing = await prisma.article.findUnique({ where: { slug } });

    if (existing) {
      await prisma.article.update({
        where: { slug },
        data: {
          headline,
          subheadline,
          body,
          format,
          region,
          publishedAt,
          quickTake,
          whyItMatters,
          takeaways,
          status: ArticleStatus.PUBLISHED,
        },
      });
      updated++;
    } else {
      const article = await prisma.article.create({
        data: {
          headline,
          subheadline,
          slug,
          body,
          authorId: author.id,
          status: ArticleStatus.PUBLISHED,
          publishedAt,
          format,
          region,
          quickTake,
          whyItMatters,
          takeaways,
          priorityScore: 50,
        },
      });

      // Link to category
      await prisma.articleCategory.create({
        data: { articleId: article.id, categoryId: category.id },
      });

      created++;
    }

    console.log(`  ${existing ? "updated" : "created"}: ${slug}`);
  }

  console.log(`\nDone. Created: ${created}, Updated: ${updated}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
