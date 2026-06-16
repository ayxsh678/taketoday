-- Add pgvector embedding column to article_embeddings.
-- pgvector extension was already enabled in migration 20260530090000_add_vector_search.
-- Using IF NOT EXISTS so this is safe to re-run.

ALTER TABLE "article_embeddings"
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- HNSW index for fast approximate cosine similarity search.
-- m=16, ef_construction=64 are balanced defaults for a growing corpus.
-- Adjust m upward (32-64) when corpus exceeds 1M vectors.
CREATE INDEX IF NOT EXISTS article_embeddings_hnsw_idx
  ON "article_embeddings"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
