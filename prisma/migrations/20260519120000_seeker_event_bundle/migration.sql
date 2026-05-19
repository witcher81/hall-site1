-- CreateTable
CREATE TABLE "SeekerEventBundle" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT,
    "eventType" TEXT NOT NULL,
    "eventDate" TEXT,
    "guestCount" INTEGER,
    "area" TEXT,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "venueId" INTEGER,
    "buildMode" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "itemsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeekerEventBundle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeekerEventBundle_userId_createdAt_idx" ON "SeekerEventBundle"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SeekerEventBundle_venueId_idx" ON "SeekerEventBundle"("venueId");

-- AddForeignKey
ALTER TABLE "SeekerEventBundle" ADD CONSTRAINT "SeekerEventBundle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeekerEventBundle" ADD CONSTRAINT "SeekerEventBundle_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
