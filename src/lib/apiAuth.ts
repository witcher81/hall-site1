import "server-only";

import { NextResponse } from "next/server";

import { getCurrentUser, type AuthUser } from "./auth";
import { isEmailVerificationRequired } from "./emailConfig";

const EMAIL_NOT_VERIFIED_MESSAGE =
  "יש לאמת את כתובת האימייל לפני פעולה זו.";

export function emailNotVerifiedResponse(): NextResponse {
  return NextResponse.json(
    { error: EMAIL_NOT_VERIFIED_MESSAGE, code: "EMAIL_NOT_VERIFIED" },
    { status: 403 }
  );
}

/** מחזיר תגובת שגיאה אם המשתמש לא מאומת; אחרת null */
export function emailVerificationGuard(
  user: AuthUser | null
): NextResponse | null {
  if (
    user &&
    !user.emailVerified &&
    isEmailVerificationRequired()
  ) {
    return emailNotVerifiedResponse();
  }
  return null;
}

export type VerifiedApiUser =
  | { user: AuthUser }
  | { response: NextResponse };

/** דורש משתמש מחובר עם אימייל מאומת ל-API */
export async function requireVerifiedApiUser(): Promise<VerifiedApiUser> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!user.emailVerified && isEmailVerificationRequired()) {
    return { response: emailNotVerifiedResponse() };
  }
  return { user };
}
