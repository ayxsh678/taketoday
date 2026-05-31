import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  getAllArticles,
  getArticleBySlug,
  getArticlesByCategory,
  getFeaturedArticles,
} from "@/lib/content/queries";

// Minimal DB row that satisfies the mapper
function makeRow(overrides: Partial<{
  slug: string;
  headline: string;
  subheadline: string;
  body: string;
  publishedAt: Date | null;
  updatedAt: Date;
  quickTake: string | null;
  whyItMatters: string | null;
  takeaways: string[];
  format: string;
  region: string;
  author: { name: string };
  categories: Array<{ category: { name: string } }>;
}> = {}) {
  return {
    slug: "test-slug",
    headline: "Test Headline",
    subheadline: "Test deck",
    body: "Body text with some words here.",
    publishedAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
    quickTake: "Quick take text",
    whyItMatters: "Why it matters text",
    takeaways: ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
    format: "DeepDive",
    region: "GLOBAL",
    author: { name: "TakeToday Newsroom" },
    categories: [{ category: { name: "AI" } }],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAllArticles [BUG-01 regression]", () => {
  it("queries only PUBLISHED articles", async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValueOnce([]);

    await getAllArticles();

    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: ArticleStatus.PUBLISHED }),
      })
    );
  });

  it("maps DB row to ArticleDoc shape correctly", async () => {
    const row = makeRow();
    vi.mocked(prisma.article.findMany).mockResolvedValueOnce([row] as never);

    const articles = await getAllArticles();

    expect(articles).toHaveLength(1);
    const a = articles[0];
    expect(a.slug).toBe("test-slug");
    expect(a.title).toBe("Test Headline");        // headline → title
    expect(a.deck).toBe("Test deck");              // subheadline → deck
    expect(a.category).toBe("AI");                 // from categories relation
    expect(a.format).toBe("DeepDive");
    expect(a.region).toBe("GLOBAL");
    expect(a.author).toEqual({ name: "TakeToday Newsroom", type: "Organization" });
    expect(a.quickTake).toBe("Quick take text");
    expect(a.whyItMatters).toBe("Why it matters text");
    expect(a.takeaways).toEqual(["Takeaway 1", "Takeaway 2", "Takeaway 3"]);
    expect(a.body).toEqual({ raw: "Body text with some words here." });
    expect(a.publishedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(a.readTime).toMatch(/\d+ min read/);
  });

  it("defaults category to AI when no categories linked", async () => {
    const row = makeRow({ categories: [] });
    vi.mocked(prisma.article.findMany).mockResolvedValueOnce([row] as never);

    const articles = await getAllArticles();
    expect(articles[0].category).toBe("AI");
  });

  it("defaults quickTake and whyItMatters to empty string when null", async () => {
    const row = makeRow({ quickTake: null, whyItMatters: null });
    vi.mocked(prisma.article.findMany).mockResolvedValueOnce([row] as never);

    const articles = await getAllArticles();
    expect(articles[0].quickTake).toBe("");
    expect(articles[0].whyItMatters).toBe("");
  });
});

describe("getArticleBySlug [BUG-01 regression]", () => {
  it("queries only PUBLISHED articles by slug", async () => {
    vi.mocked(prisma.article.findFirst).mockResolvedValueOnce(null);

    const result = await getArticleBySlug("some-slug");

    expect(result).toBeUndefined();
    expect(prisma.article.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          slug: "some-slug",
          status: ArticleStatus.PUBLISHED,
        }),
      })
    );
  });

  it("returns undefined for ARCHIVED/DRAFT (not PUBLISHED) — 404 path", async () => {
    // findFirst returns null because the WHERE clause filters by PUBLISHED
    vi.mocked(prisma.article.findFirst).mockResolvedValueOnce(null);

    const result = await getArticleBySlug("archived-slug");

    expect(result).toBeUndefined();
  });

  it("returns ArticleDoc when PUBLISHED article exists", async () => {
    const row = makeRow({ slug: "found-slug" });
    vi.mocked(prisma.article.findFirst).mockResolvedValueOnce(row as never);

    const result = await getArticleBySlug("found-slug");

    expect(result).toBeDefined();
    expect(result?.slug).toBe("found-slug");
  });
});

describe("readTime computation", () => {
  it("computes readTime from word count (200 wpm)", async () => {
    // 400 words → 2 min
    const body = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
    const row = makeRow({ body });
    vi.mocked(prisma.article.findMany).mockResolvedValueOnce([row] as never);

    const articles = await getAllArticles();
    expect(articles[0].readTime).toBe("2 min read");
  });

  it("floors to 1 min minimum", async () => {
    const row = makeRow({ body: "Short." });
    vi.mocked(prisma.article.findMany).mockResolvedValueOnce([row] as never);

    const articles = await getAllArticles();
    expect(articles[0].readTime).toBe("1 min read");
  });
});

describe("getFeaturedArticles", () => {
  it("orders by priorityScore desc then publishedAt desc", async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValueOnce([]);

    await getFeaturedArticles(4);

    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ priorityScore: "desc" }, { publishedAt: "desc" }],
        take: 4,
      })
    );
  });
});

describe("getArticlesByCategory", () => {
  it("filters by category name case-insensitively", async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValueOnce([]);

    await getArticlesByCategory("AI");

    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categories: {
            some: {
              category: {
                name: { equals: "AI", mode: "insensitive" },
              },
            },
          },
        }),
      })
    );
  });
});
