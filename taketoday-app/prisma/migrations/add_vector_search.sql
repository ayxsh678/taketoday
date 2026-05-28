-- Phase C: pgvector semantic search
-- Run this AFTER the main Prisma migration that creates ContributionEmbedding.
-- Supabase: pgvector is pre-installed. Self-hosted: install the extension first.

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add vector column to ContributionEmbedding
--    text-embedding-3-small = 1536 dims
ALTER TABLE "ContributionEmbedding"
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. HNSW index for fast approximate nearest-neighbor cosine search
--    m=16, ef_construction=64 are good defaults for most workloads.
CREATE INDEX IF NOT EXISTS contribution_embedding_hnsw_idx
  ON "ContributionEmbedding"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Optional: index for exact search on small datasets (IVFFlat)
--    Enable once you have >= 1000 rows for meaningful clustering.
-- CREATE INDEX contribution_embedding_ivfflat_idx
--   ON "ContributionEmbedding"
--   USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);
