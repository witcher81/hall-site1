import "server-only";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** בפרודקשן: עוגיית __Host- דורשת Secure ו-Path=/ בלי Domain — מחזקת מניעת דליפה בין דומיינים */
export const SESSION_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-hall_session"
  : "hall_session";

/** שמות עוגייה ישנים — מנקים בהתנתקות */
const SESSION_COOKIE_NAMES_TO_CLEAR = [
  SESSION_COOKIE_NAME,
  "__Host-hall_session",
  "hall_session",
] as const;

function sessionCookieClearOptions() {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
}

/** מחיקת סשן על תגובת Route Handler (מבטיח Set-Cookie בדפדפן) */
export function clearSessionCookiesOnResponse(res: NextResponse) {
  const opts = sessionCookieClearOptions();
  for (const name of SESSION_COOKIE_NAMES_TO_CLEAR) {
    res.cookies.set(name, "", opts);
  }
}

const LEGACY_PENDING_VERIFY_COOKIE = IS_PRODUCTION
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

/** מנקה עוגיית אימות ישנה (לפני ביטול זרימת האימות) */
export async function clearPendingVerificationCookie() {
  const cookieStore = await cookies();
  cookieStore.set(LEGACY_PENDING_VERIFY_COOKIE, "", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
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
  const opts = sessionCookieClearOptions();
  for (const name of SESSION_COOKIE_NAMES_TO_CLEAR) {
    try {
      cookieStore.delete(name);
    } catch {
      /* ignore */
    }
    cookieStore.set(name, "", opts);
  }
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
    if (!user || user.isBlocked) return null;
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
