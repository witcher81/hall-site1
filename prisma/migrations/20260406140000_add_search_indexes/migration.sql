-- Indexes for frequent filters (public venue/service search, dashboards, inquiries by venue)

CREATE INDEX "Venue_ownerId_idx" ON "Venue"("ownerId");
CREATE INDEX "Venue_maxGuests_idx" ON "Venue"("maxGuests");
CREATE INDEX "Venue_minPrice_idx" ON "Venue"("minPrice");
CREATE INDEX "Venue_maxPrice_idx" ON "Venue"("maxPrice");

CREATE INDEX "Inquiry_venueId_createdAt_idx" ON "Inquiry"("venueId", "createdAt");

CREATE INDEX "Service_providerId_idx" ON "Service"("providerId");
CREATE INDEX "Service_category_idx" ON "Service"("category");
CREATE INDEX "Service_minPrice_idx" ON "Service"("minPrice");
CREATE INDEX "Service_maxPrice_idx" ON "Service"("maxPrice");
CREATE INDEX "Service_createdAt_idx" ON "Service"("createdAt");
