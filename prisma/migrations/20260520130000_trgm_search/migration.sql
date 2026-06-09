-- Optional full-text search indexes (pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Venue_name_trgm_idx" ON "Venue" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Service_name_trgm_idx" ON "Service" USING gin ("name" gin_trgm_ops);
