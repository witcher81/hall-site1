import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertPersonalPhoneAvailable } from "@/lib/phoneUnique";
import {
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  setPendingVerificationCookie,
  setPendingVerificationCookieOnResponse,
  setSessionCookie,
  setSessionCookieOnResponse,
  type AuthUser,
} from "@/lib/auth";
import { isEmailVerificationRequired } from "@/lib/emailConfig";
import { sendEmailVerificationForUser, verificationEmailClientPayload } from "@/lib/sendEmailVerification";
import { consumeQueueBatch, publishMessage } from "@/lib/messagingQueue";
import { MessageTypes } from "@/lib/messagingQueueTypes";
import {
  USER_INPUT_MAX,
  validateEmail,
  validateIsraeliPhoneRegister,
  validateNewPassword,
  validateRequiredText,
} from "@/lib/userInputValidation";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { USER_FACING_GENERIC } from "@/lib/userFacingErrors";

const ALLOWED_ROLES = ["SEEKER", "VENUE_OWNER", "FREELANCER"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, phonePrefix, phoneDigits, turnstileToken } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      phonePrefix?: string;
      phoneDigits?: string;
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

    const passResult = validateNewPassword(password);
    if (!passResult.ok) {
      return NextResponse.json({ error: passResult.error }, { status: 400 });
    }
    const passwordPlain = passResult.value;

    const nameResult = validateRequiredText(
      name,
      USER_INPUT_MAX.DISPLAY_NAME,
      2,
      "שם מלא"
    );
    if (!nameResult.ok) {
      return NextResponse.json({ error: nameResult.error }, { status: 400 });
    }

    const roleUpper = typeof role === "string" ? role.toUpperCase() : "";
    const selectedRole = ALLOWED_ROLES.includes(
      roleUpper as (typeof ALLOWED_ROLES)[number]
    )
      ? (roleUpper as (typeof ALLOWED_ROLES)[number])
      : null;
    if (!selectedRole) {
      return NextResponse.json(
        { error: "נא לבחור סוג משתמש תקין" },
        { status: 400 }
      );
    }

    const phoneResult = validateIsraeliPhoneRegister(phonePrefix, phoneDigits);
    if (!phoneResult.ok) {
      return NextResponse.json({ error: phoneResult.error }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "האימייל כבר רשום" },
        { status: 409 }
      );
    }

    const phoneFree = await assertPersonalPhoneAvailable(phoneResult.value);
    if (!phoneFree.ok) {
      return NextResponse.json({ error: phoneFree.error }, { status: 409 });
    }

    const skipEmailVerification = !isEmailVerificationRequired();
    const passwordHash = await hashPassword(passwordPlain);
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name: nameResult.value,
          email: normalizedEmail,
          passwordHash,
          role: selectedRole,
          phone: phoneResult.value,
          emailVerified: skipEmailVerification,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        const target = e.meta?.target as string[] | undefined;
        if (target?.includes("phone")) {
          return NextResponse.json(
            { error: "מספר הטלפון כבר רשום בחשבון אחר" },
            { status: 409 }
          );
        }
      }
      throw e;
    }

    await publishMessage(MessageTypes.USER_REGISTER_POST_CREATE, {
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name ?? null,
    });
    void consumeQueueBatch().catch((err) => {
      console.error("Background job kick failed after register:", err);
    });

    if (skipEmailVerification) {
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: true,
      };
      const token = createSessionToken(authUser);
      await clearSessionCookie();
      await setSessionCookie(token);
      const res = NextResponse.json(
        { user: authUser, requiresEmailVerification: false },
        { status: 201 }
      );
      setSessionCookieOnResponse(res, token);
      return res;
    }

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
        email: user.email,
        requiresEmailVerification: true,
        ...emailPayload,
      },
      { status: 201 }
    );
    setPendingVerificationCookieOnResponse(res, user.id);
    return res;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: USER_FACING_GENERIC },
      { status: 500 }
    );
  }
}
