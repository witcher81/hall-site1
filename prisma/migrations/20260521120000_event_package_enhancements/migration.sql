-- AlterTable EventPackage
ALTER TABLE "EventPackage" ADD COLUMN "tier" TEXT;
ALTER TABLE "EventPackage" ADD COLUMN "eventTypesJson" TEXT;
ALTER TABLE "EventPackage" ADD COLUMN "guestMin" INTEGER;
ALTER TABLE "EventPackage" ADD COLUMN "guestMax" INTEGER;
ALTER TABLE "EventPackage" ADD COLUMN "venueIncludesJson" TEXT;
ALTER TABLE "EventPackage" ADD COLUMN "serviceSlotsJson" TEXT;

-- AlterTable SeekerEventBundle
ALTER TABLE "SeekerEventBundle" ADD COLUMN "sourcePackageId" INTEGER;

-- AlterTable Inquiry
ALTER TABLE "Inquiry" ADD COLUMN "eventPackageId" INTEGER;
ALTER TABLE "Inquiry" ADD COLUMN "seekerBundleId" INTEGER;

-- CreateIndex
CREATE INDEX "Inquiry_eventPackageId_idx" ON "Inquiry"("eventPackageId");
CREATE INDEX "Inquiry_seekerBundleId_idx" ON "Inquiry"("seekerBundleId");
CREATE INDEX "SeekerEventBundle_sourcePackageId_idx" ON "SeekerEventBundle"("sourcePackageId");

-- AddForeignKey
ALTER TABLE "SeekerEventBundle" ADD CONSTRAINT "SeekerEventBundle_sourcePackageId_fkey" FOREIGN KEY ("sourcePackageId") REFERENCES "EventPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_eventPackageId_fkey" FOREIGN KEY ("eventPackageId") REFERENCES "EventPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_seekerBundleId_fkey" FOREIGN KEY ("seekerBundleId") REFERENCES "SeekerEventBundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
