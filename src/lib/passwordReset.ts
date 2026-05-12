import "server-only";

import crypto from "node:crypto";

import { prisma } from "./prisma";

/** תוקף טוקן איפוס סיסמה — 60 דקות */
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** אורך תווי הטוקן (hex) — 32 בתים → 64 תווים */
export const PASSWORD_RESET_TOKEN_HEX_LENGTH = 64;

/** מקסימום טוקנים פעילים שניצור עבור משתמש; ישנים יסומנו `used` */
const MAX_ACTIVE_TOKENS_PER_USER = 5;

export function hashResetToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken, "utf8").digest("hex");
}

/** יוצר טוקן גולמי + רושם hash בלבד ב-DB. מחזיר את הטוקן הגולמי לשליחה למשתמש */
export async function createPasswordResetToken(userId: number): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  // ביטול טוקנים ישנים — שומר רק את אחרוני MAX_ACTIVE_TOKENS_PER_USER
  await invalidateOldTokensForUser(userId);

  return rawToken;
}

async function invalidateOldTokensForUser(userId: number): Promise<void> {
  const active = await prisma.passwordResetToken.findMany({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (active.length <= MAX_ACTIVE_TOKENS_PER_USER) return;
  const idsToInvalidate = active
    .slice(MAX_ACTIVE_TOKENS_PER_USER)
    .map((t) => t.id);
  if (!idsToInvalidate.length) return;
  await prisma.passwordResetToken.updateMany({
    where: { id: { in: idsToInvalidate } },
    data: { usedAt: new Date() },
  });
}

export type ValidResetToken = {
  id: number;
  userId: number;
};

/** מחפש טוקן תקף לפי הטוקן הגולמי. מחזיר null אם לא תקף/פג/בשימוש */
export async function findValidResetTokenByRaw(
  rawToken: string
): Promise<ValidResetToken | null> {
  if (!isPlausibleRawToken(rawToken)) return null;
  const tokenHash = hashResetToken(rawToken);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!row) return null;
  if (row.usedAt) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;
  return { id: row.id, userId: row.userId };
}

/** מסמן טוקן כשומש (חד פעמי). מחזיר true אם עודכן */
export async function markResetTokenUsed(id: number): Promise<boolean> {
  try {
    const res = await prisma.passwordResetToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: new Date() },
    });
    return res.count === 1;
  } catch {
    return false;
  }
}

/** בודק רק את צורת הטוקן (לפני פנייה ל-DB) — מונע פניות מיותרות */
export function isPlausibleRawToken(raw: unknown): raw is string {
  return (
    typeof raw === "string" &&
    raw.length === PASSWORD_RESET_TOKEN_HEX_LENGTH &&
    /^[a-f0-9]+$/i.test(raw)
  );
}
