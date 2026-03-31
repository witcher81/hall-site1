-- CreateTable
CREATE TABLE "VenueGalleryImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "venueId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VenueGalleryImage_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VenueGalleryImage_venueId_category_idx" ON "VenueGalleryImage"("venueId", "category");
