import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  createSessionToken,
  setPendingVerificationCookie,
  setPendingVerificationCookieOnResponse,
  setSessionCookie,
  setSessionCookieOnResponse,
  verifyPassword,
  type AuthUser,
} from "@/lib/auth";
import { isEmailVerificationRequired } from "@/lib/emailConfig";
import { sendEmailVerificationForUser, verificationEmailClientPayload } from "@/lib/sendEmailVerification";
import { validateEmail, validateLoginPassword } from "@/lib/userInputValidation";
import { USER_FACING_GENERIC, USER_FACING_LOGIN_INVALID } from "@/lib/userFacingErrors";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, turnstileToken } = body as {
      email?: string;
      password?: string;
      turnstileToken?: string;
    };

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const captcha = await verifyTurnstileToken(turnstileToken, ip);
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

    const emailResult = validateEmail(email);
    if (!emailResult.ok) {
      return NextResponse.json({ error: emailResult.error }, { status: 400 });
    }
    const normalizedEmail = emailResult.value;

    const passResult = validateLoginPassword(password);
    if (!passResult.ok) {
      return NextResponse.json({ error: passResult.error }, { status: 400 });
    }
    const passwordPlain = passResult.value;

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (
      !user ||
      user.isBlocked ||
      !(await verifyPassword(passwordPlain, user.passwordHash))
    ) {
      return NextResponse.json(
        { error: USER_FACING_LOGIN_INVALID },
        { status: 401 }
      );
    }

    let emailVerified = user.emailVerified;
    if (!emailVerified && !isEmailVerificationRequired()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
      emailVerified = true;
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified,
    };

    if (!emailVerified) {
      await clearSessionCookie();
      await setPendingVerificationCookie(user.id);

      const emailSend = await sendEmailVerificationForUser({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      const emailPayload = verificationEmailClientPayload(emailSend);

      const res = NextResponse.json(
        {
          requiresEmailVerification: true,
          email: user.email,
          ...emailPayload,
        },
        { status: 200 }
      );
      setPendingVerificationCookieOnResponse(res, user.id);
      return res;
    }

    const token = createSessionToken(authUser);
    await setSessionCookie(token);

    const res = NextResponse.json(
      { user: authUser, requiresEmailVerification: false },
      { status: 200 }
    );
    setSessionCookieOnResponse(res, token);
    const { claimDevManagedUserOnResponse } = await import(
      "@/lib/devManageSession"
    );
    await claimDevManagedUserOnResponse(res, user.id);
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: USER_FACING_GENERIC },
      { status: 500 }
    );
  }
}
