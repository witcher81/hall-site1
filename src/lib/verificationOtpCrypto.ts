import "server-only";

import crypto from "crypto";

function getSecret(): string {
  const s = process.env.JWT_SECRET?.trim();
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

export function hashOtpCode(userId: number, code: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`${userId}:${code}`)
    .digest("hex");
}

export function verifyOtpCode(userId: number, code: string, storedHash: string): boolean {
  const a = hashOtpCode(userId, code.trim());
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(storedHash, "hex");
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function generateSixDigitCode(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, "0");
}
