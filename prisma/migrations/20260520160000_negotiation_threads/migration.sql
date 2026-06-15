-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN "inquiryId" INTEGER;

-- CreateTable
CREATE TABLE "NegotiationThread" (
    "id" SERIAL NOT NULL,
    "inquiryId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "threadKey" TEXT NOT NULL,
    "serviceId" INTEGER,
    "serviceRequestId" INTEGER,
    "conversationId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NegotiationThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiationOffer" (
    "id" SERIAL NOT NULL,
    "threadId" INTEGER NOT NULL,
    "authorUserId" INTEGER NOT NULL,
    "authorRole" TEXT NOT NULL,
    "amountMinNis" INTEGER,
    "amountMaxNis" INTEGER,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "respondsToOfferId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NegotiationOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NegotiationThread_serviceRequestId_key" ON "NegotiationThread"("serviceRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "NegotiationThread_conversationId_key" ON "NegotiationThread"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "NegotiationThread_inquiryId_threadKey_key" ON "NegotiationThread"("inquiryId", "threadKey");

-- CreateIndex
CREATE INDEX "NegotiationThread_inquiryId_idx" ON "NegotiationThread"("inquiryId");

-- CreateIndex
CREATE INDEX "NegotiationOffer_threadId_createdAt_idx" ON "NegotiationOffer"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_inquiryId_idx" ON "ServiceRequest"("inquiryId");

-- CreateIndex
CREATE INDEX "ServiceRequest_userId_createdAt_idx" ON "ServiceRequest"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationThread" ADD CONSTRAINT "NegotiationThread_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationThread" ADD CONSTRAINT "NegotiationThread_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationThread" ADD CONSTRAINT "NegotiationThread_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationThread" ADD CONSTRAINT "NegotiationThread_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationOffer" ADD CONSTRAINT "NegotiationOffer_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "NegotiationThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationOffer" ADD CONSTRAINT "NegotiationOffer_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationOffer" ADD CONSTRAINT "NegotiationOffer_respondsToOfferId_fkey" FOREIGN KEY ("respondsToOfferId") REFERENCES "NegotiationOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
