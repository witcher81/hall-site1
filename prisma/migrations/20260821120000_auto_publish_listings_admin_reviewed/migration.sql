-- AlterTable
ALTER TABLE "User" ADD COLUMN "adminReviewedAt" TIMESTAMP(3);

-- Publish existing listings that were waiting for approval
UPDATE "Venue"
SET "moderationStatus" = 'APPROVED',
    "moderatedAt" = COALESCE("moderatedAt", NOW())
WHERE "moderationStatus" = 'PENDING';

UPDATE "Service"
SET "moderationStatus" = 'APPROVED',
    "moderatedAt" = COALESCE("moderatedAt", NOW())
WHERE "moderationStatus" = 'PENDING';
