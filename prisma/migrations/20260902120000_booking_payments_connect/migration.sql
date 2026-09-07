-- Stripe Connect + pay-first booking payments

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeConnectChargesEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeConnectOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeConnectAccountId_key" ON "User"("stripeConnectAccountId");

ALTER TABLE "Inquiry" ADD COLUMN IF NOT EXISTS "agreedAmountNis" INTEGER;
ALTER TABLE "Inquiry" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "Inquiry" ADD COLUMN IF NOT EXISTS "providerCancelReason" TEXT;

ALTER TABLE "ServiceRequest" ADD COLUMN IF NOT EXISTS "agreedAmountNis" INTEGER;
ALTER TABLE "ServiceRequest" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "ServiceRequest" ADD COLUMN IF NOT EXISTS "providerCancelReason" TEXT;

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "stripeRefundId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "platformFeeNis" INTEGER;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "inquiryId" INTEGER;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "serviceRequestId" INTEGER;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "providerUserId" INTEGER;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Payment_inquiryId_idx" ON "Payment"("inquiryId");
CREATE INDEX IF NOT EXISTS "Payment_serviceRequestId_idx" ON "Payment"("serviceRequestId");

CREATE TABLE IF NOT EXISTS "BookingCancellation" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "cancelledByUserId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER NOT NULL,
    "alternativesJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingCancellation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BookingCancellation_paymentId_key" ON "BookingCancellation"("paymentId");
CREATE INDEX IF NOT EXISTS "BookingCancellation_targetType_targetId_idx" ON "BookingCancellation"("targetType", "targetId");

ALTER TABLE "BookingCancellation" ADD CONSTRAINT "BookingCancellation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
