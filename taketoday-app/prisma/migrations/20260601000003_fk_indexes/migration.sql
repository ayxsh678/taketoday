-- Add missing FK indexes [BUG-13]
-- Foreign key columns without indexes cause sequential scans on joins.
-- Each index here covers a hot query path: filtering/joining by the FK column.

CREATE INDEX "Evidence_submittedById_idx" ON "Evidence"("submittedById");
CREATE INDEX "FactCheck_checkerId_idx" ON "FactCheck"("checkerId");
CREATE INDEX "CommunityVote_userId_idx" ON "CommunityVote"("userId");
CREATE INDEX "EditorialDecision_editorId_idx" ON "EditorialDecision"("editorId");
CREATE INDEX "Correction_correctedById_idx" ON "Correction"("correctedById");
CREATE INDEX "MediaAsset_folderId_idx" ON "MediaAsset"("folderId");
CREATE INDEX "SocialPost_articleId_idx" ON "SocialPost"("articleId");
CREATE INDEX "AnalyticsEvent_articleId_idx" ON "AnalyticsEvent"("articleId");
CREATE INDEX "ReviewComment_articleId_idx" ON "ReviewComment"("articleId");
