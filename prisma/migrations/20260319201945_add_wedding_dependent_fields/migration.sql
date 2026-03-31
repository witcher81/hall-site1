-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Venue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ownerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "minGuests" INTEGER,
    "maxGuests" INTEGER,
    "minPrice" INTEGER,
    "maxPrice" INTEGER,
    "description" TEXT,
    "eventTypes" TEXT,
    "kashrut" TEXT,
    "parking" TEXT,
    "venueType" TEXT,
    "seaView" BOOLEAN,
    "boutique" BOOLEAN,
    "accessible" BOOLEAN,
    "hasChuppa" BOOLEAN NOT NULL DEFAULT false,
    "hasFood" BOOLEAN NOT NULL DEFAULT false,
    "hasDanceFloor" BOOLEAN NOT NULL DEFAULT false,
    "hasTableSetup" BOOLEAN NOT NULL DEFAULT false,
    "hasSoundSystem" BOOLEAN NOT NULL DEFAULT false,
    "hasBridalRoom" BOOLEAN NOT NULL DEFAULT false,
    "hasChuppaOutdoor" BOOLEAN NOT NULL DEFAULT false,
    "hasChuppaCovered" BOOLEAN NOT NULL DEFAULT false,
    "hasVeganFood" BOOLEAN NOT NULL DEFAULT false,
    "coverImageUrl" TEXT,
    "galleryImageUrls" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Venue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Venue" ("accessible", "address", "boutique", "city", "coverImageUrl", "createdAt", "description", "eventTypes", "galleryImageUrls", "hasBridalRoom", "hasChuppa", "hasDanceFloor", "hasFood", "hasSoundSystem", "hasTableSetup", "id", "kashrut", "maxGuests", "maxPrice", "minGuests", "minPrice", "name", "ownerId", "parking", "seaView", "updatedAt", "venueType") SELECT "accessible", "address", "boutique", "city", "coverImageUrl", "createdAt", "description", "eventTypes", "galleryImageUrls", "hasBridalRoom", "hasChuppa", "hasDanceFloor", "hasFood", "hasSoundSystem", "hasTableSetup", "id", "kashrut", "maxGuests", "maxPrice", "minGuests", "minPrice", "name", "ownerId", "parking", "seaView", "updatedAt", "venueType" FROM "Venue";
DROP TABLE "Venue";
ALTER TABLE "new_Venue" RENAME TO "Venue";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
