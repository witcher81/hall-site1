-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailNotificationsJson" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ServiceFavorite" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceFavorite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContentReport" (
    "id" SERIAL NOT NULL,
    "reporterUserId" INTEGER,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Payment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "amountNis" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "venueId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceFavorite_userId_serviceId_key" ON "ServiceFavorite"("userId", "serviceId");
CREATE INDEX IF NOT EXISTS "ServiceFavorite_userId_idx" ON "ServiceFavorite"("userId");
CREATE INDEX IF NOT EXISTS "ContentReport_status_createdAt_idx" ON "ContentReport"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "ContentReport_targetType_targetId_idx" ON "ContentReport"("targetType", "targetId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Payment_venueId_idx" ON "Payment"("venueId");

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "ServiceFavorite" ADD CONSTRAINT "ServiceFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "ServiceFavorite" ADD CONSTRAINT "ServiceFavorite_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
