import "server-only";

import jwt from "jsonwebtoken";
import type { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { allowDevUserSwitchDeployment, isAdminEmail } from "@/lib/admin";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const DEV_MANAGE_COOKIE = IS_PRODUCTION
  ? "__Host-hall_dev_manage"
  : "hall_dev_manage";

const MAX_AGE_SECONDS = 60 * 30; // 30 minutes

function getSecret(): string {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (IS_PRODUCTION) {
    throw new Error("JWT_SECRET required for dev manage session");
  }
  return "dev-only-jwt-secret-min-16";
}

function cookieSetOptions() {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

function cookieClearOptions() {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
}

export function setDevManageCookieOnResponse(
  res: NextResponse,
  adminUserId: number
) {
  const token = jwt.sign(
    { adminUserId, purpose: "dev_manage" },
    getSecret(),
    { expiresIn: MAX_AGE_SECONDS }
  );
  res.cookies.set(DEV_MANAGE_COOKIE, token, cookieSetOptions());
}

export async function setDevManageCookie(adminUserId: number) {
  const token = jwt.sign(
    { adminUserId, purpose: "dev_manage" },
    getSecret(),
    { expiresIn: MAX_AGE_SECONDS }
  );
  const store = await cookies();
  store.set(DEV_MANAGE_COOKIE, token, cookieSetOptions());
}

export function clearDevManageCookieOnResponse(res: NextResponse) {
  res.cookies.set(DEV_MANAGE_COOKIE, "", cookieClearOptions());
}

export async function clearDevManageCookie() {
  const store = await cookies();
  store.set(DEV_MANAGE_COOKIE, "", cookieClearOptions());
}

export async function readPendingDevManageAdminId(): Promise<number | null> {
  if (!allowDevUserSwitchDeployment()) return null;
  const store = await cookies();
  const raw = store.get(DEV_MANAGE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const payload = jwt.verify(raw, getSecret()) as {
      adminUserId?: number;
      purpose?: string;
    };
    if (payload.purpose !== "dev_manage") return null;
    const id = Number(payload.adminUserId);
    if (!Number.isInteger(id) || id <= 0) return null;
    return id;
  } catch {
    return null;
  }
}

/**
 * אחרי התחברות/הרשמה: אם האדמין התחיל «הוסף משתמש», מקשר את החשבון הנוכחי לרשימת הדיבאג.
 */
export async function claimDevManagedUserAfterAuth(
  managedUserId: number
): Promise<{ linked: boolean; adminUserId: number | null }> {
  const adminUserId = await readPendingDevManageAdminId();
  if (!adminUserId) return { linked: false, adminUserId: null };
  if (adminUserId === managedUserId) {
    await clearDevManageCookie();
    return { linked: false, adminUserId };
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { id: true, email: true },
  });
  if (!admin || !isAdminEmail(admin.email)) {
    await clearDevManageCookie();
    return { linked: false, adminUserId: null };
  }

  await prisma.devManagedUser.upsert({
    where: {
      adminUserId_managedUserId: {
        adminUserId,
        managedUserId,
      },
    },
    create: { adminUserId, managedUserId },
    update: {},
  });
  await clearDevManageCookie();
  return { linked: true, adminUserId };
}

/** לשימוש ב-Route Handler — מקשר ומנקה עוגייה גם על ה-response */
export async function claimDevManagedUserOnResponse(
  res: NextResponse,
  managedUserId: number
): Promise<boolean> {
  const result = await claimDevManagedUserAfterAuth(managedUserId);
  clearDevManageCookieOnResponse(res);
  return result.linked;
}
