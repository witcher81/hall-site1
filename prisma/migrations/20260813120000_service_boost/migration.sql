-- AlterTable
ALTER TABLE "Service" ADD COLUMN "boostExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "serviceId" INTEGER;

-- CreateIndex
CREATE INDEX "Service_boostExpiresAt_idx" ON "Service"("boostExpiresAt");

-- CreateIndex
CREATE INDEX "Payment_serviceId_idx" ON "Payment"("serviceId");
