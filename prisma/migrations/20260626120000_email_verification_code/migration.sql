-- אימות אימייל בקוד (OTP) במקום קישור
ALTER TABLE "EmailVerificationToken" RENAME COLUMN "tokenHash" TO "codeHash";

ALTER TABLE "EmailVerificationToken" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;

-- ביטול קודים ישנים (קישורים)
UPDATE "EmailVerificationToken" SET "usedAt" = CURRENT_TIMESTAMP WHERE "usedAt" IS NULL;
