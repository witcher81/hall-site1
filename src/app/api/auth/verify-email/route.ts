import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  clearPendingVerificationCookie,
  clearPendingVerificationCookieOnResponse,
  createSessionToken,
  getPendingVerificationUser,
  setSessionCookie,
  setSessionCookieOnResponse,
  type AuthUser,
} from "@/lib/auth";
import { USER_FACING_GENERIC } from "@/lib/userFacingErrors";
import {
  markVerificationCodeUsed,
  normalizeVerificationCodeInput,
  verifyEmailCodeForUser,
} from "@/lib/emailVerification";

export const runtime = "nodejs";

const ERROR_BY_REASON: Record<string, string> = {
  invalid: "יש להזין קוד בן 6 ספרות.",
  not_found: "הקוד שגוי. נסו שוב או בקשו קוד חדש.",
  expired: "פג תוקף הקוד. בקשו קוד חדש במייל.",
  locked: "יותר מדי ניסיונות שגויים. בקשו קוד חדש.",
};

export async function POST(req: NextRequest) {
  try {
    const pending = await getPendingVerificationUser();
    if (!pending) {
      return NextResponse.json(
        { error: "פג תוקף ההמתנה לאימות. התחברו מחדש או הירשמו שוב." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const rawCode =
      typeof body?.code === "string"
        ? body.code
        : typeof body?.token === "string"
          ? body.token
          : "";

    if (!normalizeVerificationCodeInput(rawCode)) {
      return NextResponse.json(
        { error: ERROR_BY_REASON.invalid },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: pending.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        isBlocked: true,
      },
    });

    if (!user || user.isBlocked) {
      await clearPendingVerificationCookie();
      return NextResponse.json(
        { error: "החשבון אינו זמין." },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: true,
      };
      const jwt = createSessionToken(authUser);
      await clearPendingVerificationCookie();
      await setSessionCookie(jwt);
      const res = NextResponse.json({
        success: true,
        alreadyVerified: true,
        user: authUser,
      });
      setSessionCookieOnResponse(res, jwt);
      clearPendingVerificationCookieOnResponse(res);
      const { claimDevManagedUserOnResponse } = await import(
        "@/lib/devManageSession"
      );
      await claimDevManagedUserOnResponse(res, user.id);
      return res;
    }

    const verified = await verifyEmailCodeForUser(user.id, rawCode);
    if (!verified.ok) {
      return NextResponse.json(
        { error: ERROR_BY_REASON[verified.reason] ?? "אימות נכשל." },
        { status: 400 }
      );
    }

    const marked = await markVerificationCodeUsed(verified.record.id);
    if (!marked) {
      return NextResponse.json(
        { error: "הקוד כבר נוצל. בקשו קוד חדש." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: true,
    };

    const jwt = createSessionToken(authUser);
    await clearPendingVerificationCookie();
    await setSessionCookie(jwt);

    const res = NextResponse.json({ success: true, user: authUser });
    setSessionCookieOnResponse(res, jwt);
    clearPendingVerificationCookieOnResponse(res);
    const { claimDevManagedUserOnResponse } = await import(
      "@/lib/devManageSession"
    );
    await claimDevManagedUserOnResponse(res, user.id);
    return res;
  } catch (error) {
    console.error("verify-email error:", error);
    return NextResponse.json(
      { error: USER_FACING_GENERIC },
      { status: 500 }
    );
  }
}
