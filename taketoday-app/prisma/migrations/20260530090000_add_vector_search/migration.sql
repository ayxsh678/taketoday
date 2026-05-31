-- pgvector semantic search for ContributionEmbedding [Phase C]
--
-- Requires the pgvector PostgreSQL extension.
--   • Supabase / Neon / Vercel Postgres: extension is pre-installed.
--   • Self-hosted Postgres: `sudo apt install postgresql-<ver>-pgvector`
--     or compile from https://github.com/pgvector/pgvector
--
-- All statements use IF NOT EXISTS so this migration is safe to run on a
-- database where the loose add_vector_search.sql was already applied manually.
-- Existing DBs: run `prisma migrate resolve --applied 20260530090000_add_vector_search`
-- to mark this as applied without re-running it.

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add vector column (text-embedding-3-small = 1536 dims)
ALTER TABLE "ContributionEmbedding"
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. HNSW index for fast approximate nearest-neighbor cosine search
CREATE INDEX IF NOT EXISTS contribution_embedding_hnsw_idx
  ON "ContributionEmbedding"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
