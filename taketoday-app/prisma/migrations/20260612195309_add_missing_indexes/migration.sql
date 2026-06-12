/*
  Warnings:

  - You are about to drop the column `icon` on the `Category` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Article" ALTER COLUMN "body" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "icon";

-- CreateIndex
CREATE INDEX "ArticleTag_tagId_idx" ON "ArticleTag"("tagId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
