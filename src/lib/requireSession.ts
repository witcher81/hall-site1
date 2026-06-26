import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser, type AuthUser } from "./auth";

function loginRedirectPath(returnPath?: string): string {
  if (!returnPath) return "/auth/login";
  return `/auth/login?redirect=${encodeURIComponent(returnPath)}`;
}

function verifyRedirectPath(returnPath?: string): string {
  if (!returnPath) return "/auth/verify-email";
  return `/auth/verify-email?redirect=${encodeURIComponent(returnPath)}`;
}

/** דורש משתמש מחובר — מפנה להתחברות */
export async function requireSession(returnPath?: string): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginRedirectPath(returnPath));
  return user;
}

/** דורש אימייל מאומת — מפנה לדף אימות */
export async function requireVerifiedSession(
  returnPath?: string
): Promise<AuthUser> {
  const user = await requireSession(returnPath);
  if (!user.emailVerified) redirect(verifyRedirectPath(returnPath));
  return user;
}
