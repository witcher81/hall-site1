import "server-only";

import crypto from "node:crypto";

import { prisma } from "./prisma";

/** תוקף טוקן אימות אימייל — 24 שעות */
export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export const EMAIL_VERIFICATION_TOKEN_HEX_LENGTH = 64;

const MAX_ACTIVE_TOKENS_PER_USER = 5;

export function hashVerificationToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export async function createEmailVerificationToken(
  userId: number
): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS);

  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  await invalidateOldVerificationTokensForUser(userId);

  return rawToken;
}

async function invalidateOldVerificationTokensForUser(
  userId: number
): Promise<void> {
  const active = await prisma.emailVerificationToken.findMany({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (active.length <= MAX_ACTIVE_TOKENS_PER_USER) return;
  const idsToInvalidate = active
    .slice(MAX_ACTIVE_TOKENS_PER_USER)
    .map((t) => t.id);
  if (!idsToInvalidate.length) return;
  await prisma.emailVerificationToken.updateMany({
    where: { id: { in: idsToInvalidate } },
    data: { usedAt: new Date() },
  });
}

export type ValidVerificationToken = {
  id: number;
  userId: number;
};

export async function findValidVerificationTokenByRaw(
  rawToken: string
): Promise<ValidVerificationToken | null> {
  if (!isPlausibleVerificationToken(rawToken)) return null;
  const tokenHash = hashVerificationToken(rawToken);
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!row) return null;
  if (row.usedAt) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;
  return { id: row.id, userId: row.userId };
}

export async function markVerificationTokenUsed(id: number): Promise<boolean> {
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

export function isPlausibleVerificationToken(raw: unknown): raw is string {
  return (
    typeof raw === "string" &&
    raw.length === EMAIL_VERIFICATION_TOKEN_HEX_LENGTH &&
    /^[a-f0-9]+$/i.test(raw)
  );
}
