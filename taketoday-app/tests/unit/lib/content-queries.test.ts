import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  getAllArticles,
  getArticleBySlug,
  getArticlesByCategory,
  getFeaturedArticles,
} from "@/lib/content/queries";

// Minimal DB row matching the current simplified CMS schema.
// Fields removed in 20260613000000_simplify_to_cms_schema (subheadline,
// categories many-to-many, quickTake, whyItMatters, takeaways, format,
// region, priorityScore) are not present — toArticleDoc fills defaults.
function makeRow(overrides: Partial<{
  slug: string;
  headline: string;
  excerpt: string | null;
  body: string;
  publishedAt: Date | null;
  updatedAt: Date;
  category: { name: string } | null;
  author: { name: string };
}> = {}) {
  return {
    slug: "test-slug",
    headline: "Test Headline",
    excerpt: "Test deck",
    body: "Body text with some words here.",
    publishedAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
    category: { name: "AI" },
    author: { name: "TakeToday Newsroom" },
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
    expect(a.title).toBe("Test Headline");         // headline → title
    expect(a.deck).toBe("Test deck");               // excerpt → deck
    expect(a.category).toBe("AI");                  // category.name
    expect(a.format).toBe("article");               // hardcoded default
    expect(a.region).toBe("GLOBAL");                // hardcoded default
    expect(a.author).toEqual({ name: "TakeToday Newsroom", type: "Organization" });
    expect(a.quickTake).toBe("");                   // not in schema — default ""
    expect(a.whyItMatters).toBe("");                // not in schema — default ""
    expect(a.takeaways).toEqual([]);                // not in schema — default []
    expect(a.body).toEqual({ raw: "Body text with some words here." });
    expect(a.publishedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(a.readTime).toMatch(/\d+ min read/);
  });

  it("defaults category to AI when no category linked", async () => {
    const row = makeRow({ category: null });
    vi.mocked(prisma.article.findMany).mockResolvedValueOnce([row] as never);

    const articles = await getAllArticles();
    expect(articles[0].category).toBe("AI");
  });

  it("defaults deck to empty string when excerpt is null", async () => {
    const row = makeRow({ excerpt: null });
    vi.mocked(prisma.article.findMany).mockResolvedValueOnce([row] as never);

    const articles = await getAllArticles();
    expect(articles[0].deck).toBe("");
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
  it("orders by publishedAt desc and respects take limit", async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValueOnce([]);

    await getFeaturedArticles(4);

    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { publishedAt: "desc" },
        take: 4,
      })
    );
  });
});

describe("getArticlesByCategory", () => {
  it("filters by category name case-insensitively via direct relation", async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValueOnce([]);

    await getArticlesByCategory("AI");

    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: ArticleStatus.PUBLISHED,
          category: {
            name: { equals: "AI", mode: "insensitive" },
          },
        }),
      })
    );
  });
});
