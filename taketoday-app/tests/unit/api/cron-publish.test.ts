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

  it("publishLogs appends new entry to existing array (not overwrite) [BUG-12]", async () => {
    const existingLog = { published: "2024-01-01T00:00:00.000Z", trigger: "scheduled_cron" };
    vi.mocked(prisma.article.findMany).mockResolvedValue([
      {
        id: "art-1",
        headline: "Test Article",
        slug: "test-article",
        scheduledAt: new Date("2024-01-02T00:00:00Z"),
        publishLogs: [existingLog],
      },
    ] as never);
    vi.mocked(prisma.article.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.article.update).mockResolvedValue({} as never);

    await GET(makeRequest());

    expect(prisma.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "art-1" },
        data: expect.objectContaining({
          publishLogs: expect.arrayContaining([
            existingLog,
            expect.objectContaining({ trigger: "scheduled_cron" }),
          ]),
        }),
      }),
    );

    const updateCall = vi.mocked(prisma.article.update).mock.calls[0][0];
    const logs = (updateCall.data as { publishLogs: unknown[] }).publishLogs;
    expect(logs).toHaveLength(2);
  });

  it("publishLogs coerces legacy single-object format to array before appending", async () => {
    const legacyEntry = { published: "2024-01-01T00:00:00.000Z", trigger: "scheduled_cron" };
    vi.mocked(prisma.article.findMany).mockResolvedValue([
      {
        id: "art-2",
        headline: "Legacy Article",
        slug: "legacy-article",
        scheduledAt: new Date("2024-01-02T00:00:00Z"),
        publishLogs: legacyEntry, // single object, not array
      },
    ] as never);
    vi.mocked(prisma.article.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.article.update).mockResolvedValue({} as never);

    await GET(makeRequest());

    const updateCall = vi.mocked(prisma.article.update).mock.calls[0][0];
    const logs = (updateCall.data as { publishLogs: unknown[] }).publishLogs;
    expect(Array.isArray(logs)).toBe(true);
    expect(logs).toHaveLength(2);
    expect(logs[0]).toEqual(legacyEntry);
  });

  it("publishLogs starts as single-entry array when previously empty/null", async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValue([
      {
        id: "art-3",
        headline: "New Article",
        slug: "new-article",
        scheduledAt: new Date("2024-01-02T00:00:00Z"),
        publishLogs: null,
      },
    ] as never);
    vi.mocked(prisma.article.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.article.update).mockResolvedValue({} as never);

    await GET(makeRequest());

    const updateCall = vi.mocked(prisma.article.update).mock.calls[0][0];
    const logs = (updateCall.data as { publishLogs: unknown[] }).publishLogs;
    expect(Array.isArray(logs)).toBe(true);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ trigger: "scheduled_cron" });
  });

  it("skips articles with future scheduledAt (not returned by query)", async () => {
    // Prisma query filters scheduledAt ≤ now — this tests that route trusts the query
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
        publishLogs: [],
      },
    ] as never);
    vi.mocked(prisma.article.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.article.update).mockResolvedValue({} as never);

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
