import OpenAI from "openai";
import { Prisma } from "@prisma/client";
import { appConfig } from "@/lib/config/app";
import { prisma } from "@/lib/db/prisma";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMS = 1536;
const DUPLICATE_THRESHOLD = 0.92;  // cosine similarity — above = likely duplicate
const SIMILAR_THRESHOLD = 0.75;    // above = meaningfully similar

// ─── Client ───────────────────────────────────────────────────────────────────

function getClient(): OpenAI | null {
  if (!appConfig.openaiApiKey) return null;
  return new OpenAI({ apiKey: appConfig.openaiApiKey });
}

// ─── Core embedding ───────────────────────────────────────────────────────────

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const client = getClient();
  if (!client) {
    console.warn("[embeddings] OPENAI_API_KEY not set — skipping embedding");
    return null;
  }

  // Truncate to ~8000 chars (~2000 tokens) — well within 8191 token limit
  const input = text.replace(/\n+/g, " ").trim().slice(0, 8000);

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
    dimensions: EMBEDDING_DIMS,
  });

  return response.data[0]?.embedding ?? null;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export async function storeEmbedding(
  contributionId: string,
  embedding: number[],
): Promise<void> {
  const vectorLiteral = `[${embedding.join(",")}]`;

  // Upsert the metadata row via Prisma
  await prisma.contributionEmbedding.upsert({
    where: { contributionId },
    create: { contributionId, model: EMBEDDING_MODEL, dimensions: EMBEDDING_DIMS },
    update: { updatedAt: new Date() },
  });

  // Write the actual vector via raw SQL (Prisma doesn't support vector type natively)
  await prisma.$executeRaw`
    UPDATE "ContributionEmbedding"
    SET embedding = ${vectorLiteral}::vector
    WHERE "contributionId" = ${contributionId}
  `;
}

// ─── Similarity search ────────────────────────────────────────────────────────

export interface SimilarContribution {
  contributionId: string;
  similarity: number;
  title?: string;
  status?: string;
}

export async function findSimilarContributions(
  embedding: number[],
  {
    limit = 10,
    threshold = SIMILAR_THRESHOLD,
    excludeId,
  }: { limit?: number; threshold?: number; excludeId?: string } = {},
): Promise<SimilarContribution[]> {
  const vectorLiteral = `[${embedding.join(",")}]`;

  type RawRow = { contribution_id: string; similarity: number };

  // Build the optional exclusion clause using Prisma.sql so it composes correctly
  // into the outer $queryRaw template (Prisma.empty produces an empty fragment, not a nested call)
  const excludeClause = excludeId
    ? Prisma.sql`AND ce."contributionId" != ${excludeId}`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT
      ce."contributionId" AS contribution_id,
      1 - (ce.embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM "ContributionEmbedding" ce
    WHERE
      ce.embedding IS NOT NULL
      AND 1 - (ce.embedding <=> ${vectorLiteral}::vector) > ${threshold}
      ${excludeClause}
    ORDER BY ce.embedding <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `;

  if (!rows.length) return [];

  // Enrich with contribution metadata
  const ids = rows.map((r) => r.contribution_id);
  const contributions = await prisma.contribution.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true, status: true },
  });

  const contribMap = new Map(contributions.map((c) => [c.id, c]));

  return rows.map((r) => ({
    contributionId: r.contribution_id,
    similarity: Number(r.similarity),
    title: contribMap.get(r.contribution_id)?.title,
    status: contribMap.get(r.contribution_id)?.status,
  }));
}

// ─── Duplicate detection ──────────────────────────────────────────────────────

export interface DuplicateResult {
  isDuplicate: boolean;
  similarContributions: SimilarContribution[];
  topSimilarity: number;
}

export async function checkForDuplicates(
  contributionId: string,
  embedding: number[],
): Promise<DuplicateResult> {
  const similar = await findSimilarContributions(embedding, {
    threshold: SIMILAR_THRESHOLD,
    excludeId: contributionId,
    limit: 5,
  });

  const topSimilarity = similar[0]?.similarity ?? 0;
  const isDuplicate = topSimilarity >= DUPLICATE_THRESHOLD;

  return { isDuplicate, similarContributions: similar, topSimilarity };
}

// ─── Semantic search (query → contributions) ──────────────────────────────────

export async function semanticSearch(
  query: string,
  {
    limit = 20,
    threshold = 0.55,
  }: { limit?: number; threshold?: number; statusFilter?: string } = {},
): Promise<SimilarContribution[]> {
  const embedding = await generateEmbedding(query);
  if (!embedding) return [];

  return findSimilarContributions(embedding, { limit, threshold });
}
