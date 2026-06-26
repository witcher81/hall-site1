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
import { sendEmailVerificationForUser } from "@/lib/sendEmailVerification";
import { validateEmail, validateLoginPassword } from "@/lib/userInputValidation";
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
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    };

    if (!user.emailVerified) {
      await clearSessionCookie();
      await setPendingVerificationCookie(user.id);

      void sendEmailVerificationForUser({
        userId: user.id,
        email: user.email,
        name: user.name,
      }).catch((err) => {
        console.error("verification code failed after login:", err);
      });

      const res = NextResponse.json(
        { requiresEmailVerification: true, email: user.email },
        { status: 200 }
      );
      setPendingVerificationCookieOnResponse(res, user.id);
      return res;
    }

    const token = createSessionToken(authUser);
    await setSessionCookie(token);

    const res = NextResponse.json({ user: authUser }, { status: 200 });
    setSessionCookieOnResponse(res, token);
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
