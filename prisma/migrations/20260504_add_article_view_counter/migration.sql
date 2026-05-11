-- Add view counter fields to Article table
ALTER TABLE "Article" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Article" ADD COLUMN "uniqueViewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Article" ADD COLUMN "lastViewedAt" TIMESTAMP(3);

-- Create index for sorting by popularity
CREATE INDEX "Article_viewCount_idx" ON "Article"("viewCount");
