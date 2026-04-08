import "server-only";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const VERIFY_PENDING_MAX_AGE_SECONDS = 60 * 45; // 45 דקות להשלמת אימות אחרי הרשמה

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** בפרודקשן: עוגיית __Host- דורשת Secure ו-Path=/ בלי Domain — מחזקת מניעת דליפה בין דומיינים */
export const SESSION_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-hall_session"
  : "hall_session";

export const PENDING_VERIFY_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-hall_verify_pending"
  : "hall_verify_pending";

let jwtSecretCache: string | null = null;

function getJwtSecret(): string {
  if (jwtSecretCache !== null) return jwtSecretCache;

  const fromEnv = process.env.JWT_SECRET?.trim();
  if (IS_PRODUCTION) {
    const onVercel = process.env.VERCEL === "1";
    const minLen = onVercel ? 32 : 16;
    if (!fromEnv || fromEnv.length < minLen) {
      throw new Error(
        onVercel
          ? "JWT_SECRET חייב להיות מוגדר בפרודקשן ב-Vercel (לפחות 32 תווים)."
          : "JWT_SECRET חייב להיות מוגדר בפרודקשן (לפחות 16 תווים). הוסף ל-.env או הגדר ב-Vercel."
      );
    }
    if (fromEnv === "dev-secret-change-me") {
      throw new Error("JWT_SECRET לא יכול להיות ערך ברירת מחדל בפרודקשן.");
    }
    jwtSecretCache = fromEnv;
    return jwtSecretCache;
  }
  jwtSecretCache =
    fromEnv && fromEnv.length > 0 ? fromEnv : "dev-secret-change-me";
  return jwtSecretCache;
}

export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(user: AuthUser) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      ev: user.emailVerified,
    },
    getJwtSecret(),
    { expiresIn: SESSION_MAX_AGE_SECONDS }
  );
}

const VERIFY_PENDING_TYP = "verify_pending" as const;

export function createPendingVerificationToken(userId: number): string {
  return jwt.sign(
    { typ: VERIFY_PENDING_TYP, sub: userId },
    getJwtSecret(),
    { expiresIn: VERIFY_PENDING_MAX_AGE_SECONDS }
  );
}

export async function setPendingVerificationCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(PENDING_VERIFY_COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: VERIFY_PENDING_MAX_AGE_SECONDS,
  });
}

export async function clearPendingVerificationCookie() {
  const cookieStore = await cookies();
  cookieStore.set(PENDING_VERIFY_COOKIE_NAME, "", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getPendingVerificationUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PENDING_VERIFY_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getJwtSecret()) as unknown as {
      typ?: string;
      sub?: number | string;
    };
    if (payload.typ !== VERIFY_PENDING_TYP) return null;
    const subId = Number(payload.sub);
    if (!Number.isInteger(subId) || subId <= 0) return null;
    return subId;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret()) as unknown as {
      sub: number | string;
      email: string;
      name: string | null;
      role: string;
    };
    const subId = Number(payload.sub);
    if (!Number.isInteger(subId) || subId <= 0) return null;

    const user = await prisma.user.findUnique({
      where: { id: subId },
    });
    if (!user) return null;
    if (!user.emailVerified) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    };
  } catch {
    return null;
  }
}
