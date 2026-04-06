-- Unique index on personal phone (multiple NULL allowed in PostgreSQL)
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
