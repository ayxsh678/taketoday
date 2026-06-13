import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/cron/publish/route";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

vi.mock("@/lib/config/app", () => ({
  appConfig: {
    isDevelopment: true,
    buttondownApiKey: "",
    siteUrl: "http://localhost:3000",
  },
}));

vi.mock("@/lib/integrations/buttondown", () => ({
  sendArticleBroadcast: vi.fn().mockResolvedValue(undefined),
}));

function makeRequest(secret?: string) {
  const url = new URL("http://localhost/api/cron/publish");
  const headers: Record<string, string> = {};
  if (secret) headers["authorization"] = `Bearer ${secret}`;
  return new NextRequest(url, { headers });
}

describe("GET /api/cron/publish [BUG-12]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  it("returns ok with 0 published when no due articles", async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.published).toBe(0);
  });

  it("publishes due articles via updateMany with PUBLISHED status", async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValue([
      {
        id: "art-1",
        headline: "Test Article",
        slug: "test-article",
        scheduledAt: new Date("2024-01-02T00:00:00Z"),
      },
    ] as never);
    vi.mocked(prisma.article.updateMany).mockResolvedValue({ count: 1 });

    await GET(makeRequest());

    expect(prisma.article.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ["art-1"] } }),
        data: expect.objectContaining({
          status: "PUBLISHED",
          publishedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("includes published article ids and slugs in response", async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValue([
      {
        id: "art-2",
        headline: "Article Two",
        slug: "article-two",
        scheduledAt: new Date(),
      },
    ] as never);
    vi.mocked(prisma.article.updateMany).mockResolvedValue({ count: 1 });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(body.published).toBe(1);
    expect(body.articles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "art-2", slug: "article-two" }),
      ]),
    );
  });

  it("skips articles with future scheduledAt (not returned by query)", async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.published).toBe(0);
    expect(prisma.article.updateMany).not.toHaveBeenCalled();
  });

  it("sets publishedAt on published articles via updateMany", async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValue([
      {
        id: "art-4",
        headline: "Scheduled Article",
        slug: "scheduled-article",
        scheduledAt: new Date(),
      },
    ] as never);
    vi.mocked(prisma.article.updateMany).mockResolvedValue({ count: 1 });

    await GET(makeRequest());

    expect(prisma.article.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PUBLISHED",
          publishedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("rejects unauthorized requests when CRON_SECRET is set", async () => {
    process.env.CRON_SECRET = "secret123";

    const res = await GET(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("accepts authorized requests when CRON_SECRET matches", async () => {
    process.env.CRON_SECRET = "secret123";
    vi.mocked(prisma.article.findMany).mockResolvedValue([]);

    const res = await GET(makeRequest("secret123"));
    expect(res.status).toBe(200);
  });
});
