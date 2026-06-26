import "server-only";

import crypto from "node:crypto";

import { prisma } from "./prisma";

/** תוקף קוד אימות — 15 דקות */
export const EMAIL_VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;

export const EMAIL_VERIFICATION_CODE_LENGTH = 6;

export const MAX_CODE_ATTEMPTS = 5;

const MAX_ACTIVE_CODES_PER_USER = 3;

export function hashVerificationCode(rawCode: string): string {
  return crypto.createHash("sha256").update(rawCode, "utf8").digest("hex");
}

function generateSixDigitCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** יוצר קוד 6 ספרות ורושם hash ב-DB. מחזיר את הקוד הגולמי לשליחה במייל */
export async function createEmailVerificationCode(
  userId: number
): Promise<string> {
  const rawCode = generateSixDigitCode();
  const codeHash = hashVerificationCode(rawCode);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_CODE_TTL_MS);

  await prisma.emailVerificationToken.create({
    data: { userId, codeHash, expiresAt },
  });

  await invalidateOldCodesForUser(userId);

  return rawCode;
}

async function invalidateOldCodesForUser(userId: number): Promise<void> {
  const active = await prisma.emailVerificationToken.findMany({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (active.length <= MAX_ACTIVE_CODES_PER_USER) return;
  const idsToInvalidate = active
    .slice(MAX_ACTIVE_CODES_PER_USER)
    .map((t) => t.id);
  if (!idsToInvalidate.length) return;
  await prisma.emailVerificationToken.updateMany({
    where: { id: { in: idsToInvalidate } },
    data: { usedAt: new Date() },
  });
}

export type ValidVerificationCode = {
  id: number;
  userId: number;
  attempts: number;
};

export function normalizeVerificationCodeInput(raw: unknown): string | null {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length !== EMAIL_VERIFICATION_CODE_LENGTH) return null;
  return digits;
}

/** מחפש קוד תקף עבור משתמש — מגדיל attempts בניחוש שגוי */
export async function verifyEmailCodeForUser(
  userId: number,
  rawCode: string
): Promise<
  | { ok: true; record: ValidVerificationCode }
  | { ok: false; reason: "invalid" | "expired" | "locked" | "not_found" }
> {
  const normalized = normalizeVerificationCodeInput(rawCode);
  if (!normalized) return { ok: false, reason: "invalid" };

  const latest = await prisma.emailVerificationToken.findFirst({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, attempts: true, codeHash: true },
  });

  if (!latest) return { ok: false, reason: "expired" };
  if (latest.attempts >= MAX_CODE_ATTEMPTS) {
    return { ok: false, reason: "locked" };
  }

  const codeHash = hashVerificationCode(normalized);
  if (latest.codeHash !== codeHash) {
    await incrementCodeAttempts(latest.id);
    if (latest.attempts + 1 >= MAX_CODE_ATTEMPTS) {
      return { ok: false, reason: "locked" };
    }
    return { ok: false, reason: "not_found" };
  }

  return {
    ok: true,
    record: {
      id: latest.id,
      userId: latest.userId,
      attempts: latest.attempts,
    },
  };
}

export async function incrementCodeAttempts(id: number): Promise<void> {
  await prisma.emailVerificationToken.update({
    where: { id },
    data: { attempts: { increment: 1 } },
  });
}

export async function markVerificationCodeUsed(id: number): Promise<boolean> {
  try {
    const res = await prisma.emailVerificationToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: new Date() },
    });
    return res.count === 1;
  } catch {
    return false;
  }
}
