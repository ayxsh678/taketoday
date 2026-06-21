-- TakeToday: PostgreSQL Full-Text Search setup
-- Run ONCE via Neon SQL console or:
--   psql $DIRECT_URL < scripts/add-fts.sql
--
-- After this runs the trigger auto-maintains searchVector on every
-- INSERT/UPDATE — no app code changes needed on publish.

-- 1. Column
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- 2. GIN index (tsvector requires GIN, not btree)
CREATE INDEX IF NOT EXISTS "Article_searchVector_idx"
  ON "Article" USING GIN("searchVector");

-- 3. Function: strip HTML, build weighted tsvector
--    headline = weight A (highest rank), excerpt = B, body = C
CREATE OR REPLACE FUNCTION update_article_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW.headline, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.excerpt, '')),  'B') ||
    setweight(to_tsvector('english',
      coalesce(regexp_replace(NEW.body, '<[^>]*>', ' ', 'g'), '')
    ), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger: fires before every INSERT or UPDATE
DROP TRIGGER IF EXISTS "Article_search_vector_trigger" ON "Article";
CREATE TRIGGER "Article_search_vector_trigger"
  BEFORE INSERT OR UPDATE ON "Article"
  FOR EACH ROW EXECUTE FUNCTION update_article_search_vector();

-- 5. Backfill existing articles
UPDATE "Article"
SET "searchVector" =
  setweight(to_tsvector('english', coalesce(headline, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(excerpt,  '')), 'B') ||
  setweight(to_tsvector('english',
    coalesce(regexp_replace(body, '<[^>]*>', ' ', 'g'), '')
  ), 'C');
