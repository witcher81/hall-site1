-- AlterTable
ALTER TABLE "Venue" ADD COLUMN "parkingKind" TEXT;

UPDATE "Venue"
SET "parkingKind" = CASE
  WHEN "hasParkingNearby" = false THEN 'none'
  WHEN "parkingLatitude" IS NOT NULL
    AND "parkingLongitude" IS NOT NULL
    AND "parkingLatitude" >= 29
    AND "parkingLatitude" <= 34
    AND "parkingLongitude" >= 33
    AND "parkingLongitude" <= 36
    THEN 'nearby'
  ELSE 'adjacent'
END;
