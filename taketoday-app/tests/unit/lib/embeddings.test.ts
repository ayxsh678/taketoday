import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { findSimilarContributions } from "@/lib/contributor/embeddings";

const EMBEDDING_1536 = new Array(1536).fill(0.1) as number[];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Prisma.sql fragment composition [BUG-08]", () => {
  it("Prisma.sql with excludeId produces parameterized SQL fragment", () => {
    const excludeId = "cld123testid";
    const fragment = Prisma.sql`AND ce."contributionId" != ${excludeId}`;
    expect(fragment.sql).toContain(`AND ce."contributionId" !=`);
    expect(fragment.values).toContain(excludeId);
  });

  it("Prisma.empty produces empty SQL string with no values", () => {
    expect(Prisma.empty.sql).toBe("");
    expect(Prisma.empty.values).toEqual([]);
  });
});

describe("findSimilarContributions [BUG-08]", () => {
  it("calls $queryRaw exactly once with excludeId (no nested $queryRaw)", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);

    await findSimilarContributions(EMBEDDING_1536, { excludeId: "contrib-abc" });

    // Buggy code nested prisma.$queryRaw inside another template, corrupting SQL.
    // After fix, $queryRaw is invoked exactly once via the outer template only.
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("calls $queryRaw exactly once without excludeId", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);

    await findSimilarContributions(EMBEDDING_1536, {});

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("returns empty array when $queryRaw returns no rows", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);

    const result = await findSimilarContributions(EMBEDDING_1536, { excludeId: "any-id" });

    expect(result).toEqual([]);
    // contribution.findMany should NOT be called when no rows returned
    expect(prisma.contribution.findMany).not.toHaveBeenCalled();
  });

  it("enriches results with contribution metadata", async () => {
    const rows = [
      { contribution_id: "id-1", similarity: 0.9 },
      { contribution_id: "id-2", similarity: 0.8 },
    ];
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce(rows);
    type ContribRow = Awaited<ReturnType<typeof prisma.contribution.findMany>>;
    vi.mocked(prisma.contribution.findMany).mockResolvedValueOnce([
      { id: "id-1", title: "Test Article", status: "PUBLISHED" },
      { id: "id-2", title: "Another Article", status: "DRAFT" },
    ] as unknown as ContribRow);

    const result = await findSimilarContributions(EMBEDDING_1536, {});

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ contributionId: "id-1", similarity: 0.9, title: "Test Article" });
    expect(result[1]).toMatchObject({ contributionId: "id-2", similarity: 0.8, title: "Another Article" });
  });
});
