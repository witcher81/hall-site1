-- אישור מנהל לפני פרסום אולמות ושירותים (תוכן קיים מאושר אוטומטית)
ALTER TABLE "Venue" ADD COLUMN "moderationStatus" TEXT NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Venue" ADD COLUMN "moderationNote" TEXT;
ALTER TABLE "Venue" ADD COLUMN "moderatedAt" TIMESTAMP(3);
ALTER TABLE "Venue" ADD COLUMN "moderatedByUserId" INTEGER;
ALTER TABLE "Venue" ADD COLUMN "submittedForReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Venue" ADD COLUMN "contentRevision" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Service" ADD COLUMN "moderationStatus" TEXT NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Service" ADD COLUMN "moderationNote" TEXT;
ALTER TABLE "Service" ADD COLUMN "moderatedAt" TIMESTAMP(3);
ALTER TABLE "Service" ADD COLUMN "moderatedByUserId" INTEGER;
ALTER TABLE "Service" ADD COLUMN "submittedForReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Service" ADD COLUMN "contentRevision" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX "Venue_moderationStatus_idx" ON "Venue"("moderationStatus");
CREATE INDEX "Service_moderationStatus_idx" ON "Service"("moderationStatus");

CREATE TABLE "ListingModerationEvent" (
    "id" SERIAL NOT NULL,
    "listingType" TEXT NOT NULL,
    "listingId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "note" TEXT,
    "actorUserId" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'ADMIN',
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingModerationEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ListingModerationEvent_listingType_listingId_createdAt_idx" ON "ListingModerationEvent"("listingType", "listingId", "createdAt");
CREATE INDEX "ListingModerationEvent_toStatus_createdAt_idx" ON "ListingModerationEvent"("toStatus", "createdAt");

-- תוכן חדש ממתין לאישור; קיים נשאר מאושר
ALTER TABLE "Venue" ALTER COLUMN "moderationStatus" SET DEFAULT 'PENDING';
ALTER TABLE "Service" ALTER COLUMN "moderationStatus" SET DEFAULT 'PENDING';
