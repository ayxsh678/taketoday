-- CreateEnum
CREATE TYPE "DraftType" AS ENUM ('CAROUSEL', 'REEL_SCRIPT');

-- CreateEnum
CREATE TYPE "PostPlatform" AS ENUM ('INSTAGRAM', 'TWITTER', 'LINKEDIN', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('PENDING', 'POSTED', 'FAILED');

-- CreateTable
CREATE TABLE "content_drafts" (
    "id" TEXT NOT NULL,
    "type" "DraftType" NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_posts" (
    "id" TEXT NOT NULL,
    "draftId" TEXT,
    "platform" "PostPlatform" NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scheduledAt" TIMESTAMP(3),
    "status" "PostStatus" NOT NULL DEFAULT 'PENDING',
    "platformPostId" TEXT,
    "errorMessage" TEXT,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_posts_status_scheduledAt_idx" ON "scheduled_posts"("status", "scheduledAt");

-- AddForeignKey
ALTER TABLE "content_drafts" ADD CONSTRAINT "content_drafts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "content_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
