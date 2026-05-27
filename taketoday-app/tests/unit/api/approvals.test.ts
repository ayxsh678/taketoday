import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/approvals/route";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";
import { ArticleStatus } from "@prisma/client";

// Mock getOrCreateAdminUser
vi.mock("@/lib/admin/current-user", () => ({
  getOrCreateAdminUser: vi.fn().mockResolvedValue({ id: "reviewer-1", name: "Reviewer" }),
}));

// Mock audit logger
vi.mock("@/lib/admin/audit", () => ({
  logAuditAction: vi.fn().mockResolvedValue(undefined),
}));

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/approvals", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const underReviewArticle = {
  id: "art-1",
  headline: "Test Article",
  subheadline: "Test sub",
  slug: "test-article",
  status: ArticleStatus.UNDER_REVIEW,
  breaking: false,
  priorityScore: 50,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const approvedArticle = {
  ...underReviewArticle,
  status: ArticleStatus.APPROVED,
  author: { name: "Author", email: "a@test.com" },
  categories: [],
  tags: [],
  reviewComments: [],
};

describe("POST /api/admin/approvals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 422 when articleId is missing", async () => {
    const res = await POST(makeRequest({ decision: "approve" }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("returns 422 when decision is invalid", async () => {
    const res = await POST(makeRequest({ articleId: "art-1", decision: "maybe" }));
    expect(res.status).toBe(422);
  });

  it("returns 404 when article not found", async () => {
    vi.mocked(prisma.article.findUnique).mockResolvedValue(null);
    const res = await POST(makeRequest({ articleId: "art-1", decision: "approve" }));
    expect(res.status).toBe(404);
  });

  it("returns 422 when article is not under review", async () => {
    vi.mocked(prisma.article.findUnique).mockResolvedValue({
      ...underReviewArticle,
      status: ArticleStatus.DRAFT,
    } as never);
    const res = await POST(makeRequest({ articleId: "art-1", decision: "approve" }));
    expect(res.status).toBe(422);
  });

  it("approves article via transaction", async () => {
    vi.mocked(prisma.article.findUnique).mockResolvedValue(underReviewArticle as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      if (typeof fn === "function") {
        const result = await fn({
          article: { update: vi.fn().mockResolvedValue(approvedArticle) },
          reviewComment: { create: vi.fn() },
        } as never);
        return result;
      }
      return fn;
    });

    const res = await POST(makeRequest({ articleId: "art-1", decision: "approve" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.article.status).toBe("approved");
  });
});
