import { PrismaClient, AdminRole, ArticleStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: "ayush@taketoday.com" },
    update: {},
    create: {
      name: "Ayush Verma",
      email: "ayush@taketoday.com",
      role: AdminRole.SUPER_ADMIN,
    },
  });

  const ai = await prisma.category.upsert({
    where: { slug: "ai" },
    update: {},
    create: { name: "AI", slug: "ai" },
  });

  const openai = await prisma.tag.upsert({
    where: { slug: "openai" },
    update: {},
    create: { name: "OpenAI", slug: "openai" },
  });

  const article = await prisma.article.upsert({
    where: { slug: "openai-enterprise-workspace-controls" },
    update: {},
    create: {
      headline: "OpenAI launches enterprise workspace controls",
      subheadline: "The release raises the baseline for AI governance in large teams.",
      slug: "openai-enterprise-workspace-controls",
      body: "Enterprise AI controls are becoming the new buying baseline for large organizations.",
      authorId: superAdmin.id,
      status: ArticleStatus.PUBLISHED,
      priorityScore: 94,
      seoTitle: "OpenAI enterprise workspace controls explained",
      seoDescription: "What OpenAI's enterprise controls mean for CIOs and AI governance teams.",
      publishedAt: new Date("2026-05-20T08:00:00Z"),
    },
  });

  await prisma.articleCategory.upsert({
    where: { articleId_categoryId: { articleId: article.id, categoryId: ai.id } },
    update: {},
    create: { articleId: article.id, categoryId: ai.id },
  });

  await prisma.articleTag.upsert({
    where: { articleId_tagId: { articleId: article.id, tagId: openai.id } },
    update: {},
    create: { articleId: article.id, tagId: openai.id },
  });

  await prisma.notification.create({
    data: {
      title: "Admin panel seeded",
      message: "TakeToday admin workspace is ready for content operations.",
      kind: "system",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
