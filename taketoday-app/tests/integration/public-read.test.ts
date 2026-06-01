/**
 * Integration tests for the public contributions read path.
 * Tests GET /api/contribute — the public-facing endpoint that defaults to PUBLISHED
 * workflowStage and supports pagination, type filtering, and author filtering.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/contribute/route";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

function makeRequest(params?: Record<string, string>) {
  const url = new URL("http://localhost/api/contribute");
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

const PUBLISHED_CONTRIBUTION = {
  id: "contrib-1",
  type: "INVESTIGATION",
  title: "Test Article",
  slug: "test-article",
  summary: "Summary",
  workflowStage: "PUBLISHED",
  isBreaking: false,
  language: "en",
  location: null,
  tags: [],
  confidenceScore: null,
  publishedAt: new Date("2024-01-01"),
  createdAt: new Date("2024-01-01"),
  author: {
    id: "user-1",
    username: "journalist",
    displayName: "Journalist",
    avatar: null,
    isVerifiedJournalist: true,
    reputation: { tier: "EXPERT", overallScore: 3500 },
  },
  _count: { communityVotes: 5, factChecks: 2, evidence: 3, collaborators: 1 },
};

describe("GET /api/contribute — public read path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only PUBLISHED contributions by default", async () => {
    vi.mocked(prisma.contribution.count).mockResolvedValue(1);
    vi.mocked(prisma.contribution.findMany).mockResolvedValue([PUBLISHED_CONTRIBUTION] as never);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.contributions).toHaveLength(1);

    // Verify the query used workflowStage: PUBLISHED as default filter
    expect(prisma.contribution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workflowStage: "PUBLISHED" }),
      }),
    );
  });

  it("pagination: respects page and limit params", async () => {
    vi.mocked(prisma.contribution.count).mockResolvedValue(100);
    vi.mocked(prisma.contribution.findMany).mockResolvedValue([]);

    const res = await GET(makeRequest({ page: "3", limit: "10" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.contribution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
    expect(body.data.pagination).toMatchObject({
      page: 3,
      limit: 10,
      total: 100,
      pages: 10,
    });
  });

  it("filters by type when type param provided", async () => {
    vi.mocked(prisma.contribution.count).mockResolvedValue(0);
    vi.mocked(prisma.contribution.findMany).mockResolvedValue([]);

    await GET(makeRequest({ type: "INVESTIGATION" }));

    expect(prisma.contribution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: "INVESTIGATION" }),
      }),
    );
  });

  it("filters by authorId when provided", async () => {
    vi.mocked(prisma.contribution.count).mockResolvedValue(0);
    vi.mocked(prisma.contribution.findMany).mockResolvedValue([]);

    await GET(makeRequest({ authorId: "user-42" }));

    expect(prisma.contribution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ authorId: "user-42" }),
      }),
    );
  });

  it("allows filtering by workflowStage (e.g. contributor reads own DRAFTs)", async () => {
    vi.mocked(prisma.contribution.count).mockResolvedValue(2);
    vi.mocked(prisma.contribution.findMany).mockResolvedValue([]);

    await GET(makeRequest({ status: "DRAFT", authorId: "user-1" }));

    expect(prisma.contribution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workflowStage: "DRAFT" }),
      }),
    );
  });

  it("returns empty array and correct pagination when no contributions found", async () => {
    vi.mocked(prisma.contribution.count).mockResolvedValue(0);
    vi.mocked(prisma.contribution.findMany).mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.contributions).toEqual([]);
    expect(body.data.pagination.total).toBe(0);
    expect(body.data.pagination.pages).toBe(0);
  });

  it("returns 422 on invalid pagination params", async () => {
    const res = await GET(makeRequest({ page: "0" }));
    expect(res.status).toBe(422);
  });

  it("caps limit at 50", async () => {
    vi.mocked(prisma.contribution.count).mockResolvedValue(0);
    vi.mocked(prisma.contribution.findMany).mockResolvedValue([]);

    await GET(makeRequest({ limit: "200" }));

    // Invalid — limit.max is 50, so 422
    expect(prisma.contribution.findMany).not.toHaveBeenCalled();
  });

  it("response does not include ContributionStatus (field removed in BUG-17a)", async () => {
    vi.mocked(prisma.contribution.count).mockResolvedValue(1);
    vi.mocked(prisma.contribution.findMany).mockResolvedValue([PUBLISHED_CONTRIBUTION] as never);

    const res = await GET(makeRequest());
    const body = await res.json();
    const contribution = body.data.contributions[0];

    // The select no longer includes `status` (ContributionStatus removed in BUG-17a)
    expect(contribution).not.toHaveProperty("status");
    expect(contribution).toHaveProperty("workflowStage");
  });
});
