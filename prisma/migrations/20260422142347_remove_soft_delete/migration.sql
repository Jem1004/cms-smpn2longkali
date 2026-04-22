/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `Article` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Article_status_isDeleted_publishedAt_idx";

-- AlterTable
ALTER TABLE "Article" DROP COLUMN "isDeleted";

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");
