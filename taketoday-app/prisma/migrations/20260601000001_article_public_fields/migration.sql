-- Add public-site editorial fields to Article [BUG-01]
-- These fields are required to render DB articles on the public site.

ALTER TABLE "Article" ADD COLUMN "quickTake"    TEXT;
ALTER TABLE "Article" ADD COLUMN "whyItMatters" TEXT;
ALTER TABLE "Article" ADD COLUMN "takeaways"    TEXT[]  NOT NULL DEFAULT '{}';
ALTER TABLE "Article" ADD COLUMN "format"       TEXT    NOT NULL DEFAULT 'Article';
ALTER TABLE "Article" ADD COLUMN "region"       TEXT    NOT NULL DEFAULT 'GLOBAL';
