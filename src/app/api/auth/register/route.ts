import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertPersonalPhoneAvailable } from "@/lib/phoneUnique";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
  type AuthUser,
} from "@/lib/auth";
import { consumeQueueBatch, publishMessage } from "@/lib/messagingQueue";
import { MessageTypes } from "@/lib/messagingQueueTypes";
import {
  USER_INPUT_MAX,
  validateEmail,
  validateIsraeliPhoneRegister,
  validateNewPassword,
  validateOptionalShortText,
} from "@/lib/userInputValidation";

const ALLOWED_ROLES = ["SEEKER", "VENUE_OWNER", "FREELANCER"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, phonePrefix, phoneDigits } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      phonePrefix?: string;
      phoneDigits?: string;
    };

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

    const nameResult = validateOptionalShortText(
      name,
      USER_INPUT_MAX.DISPLAY_NAME,
      "שם"
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
          emailVerified: true,
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

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    };
    const token = createSessionToken(authUser);
    await setSessionCookie(token);

    await publishMessage(MessageTypes.USER_REGISTER_POST_CREATE, {
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name ?? null,
    });
    // ניסיון עיבוד מיידי ברקע; אם לא יושלם (למשל serverless freeze),
    // ה־Cron ימשיך לעבד את התור.
    void consumeQueueBatch().catch((err) => {
      console.error("Background job kick failed after register:", err);
    });

    return NextResponse.json({ user: authUser }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
