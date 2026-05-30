-- AlterEnum
ALTER TYPE "SocialPlatform" ADD VALUE 'THREADS';

-- AlterTable
ALTER TABLE "ShortVideoJob" ADD COLUMN     "templateId" TEXT DEFAULT 'taketoday-news';
