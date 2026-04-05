import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import {
  USER_INPUT_MAX,
  validateEmail,
  validateNewPassword,
  validateOptionalShortText,
} from "@/lib/userInputValidation";

const ALLOWED_ROLES = ["SEEKER", "VENUE_OWNER", "FREELANCER"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
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

    const selectedRole = ALLOWED_ROLES.includes(
      (role || "SEEKER").toUpperCase() as (typeof ALLOWED_ROLES)[number]
    )
      ? (role || "SEEKER").toUpperCase()
      : "SEEKER";

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "האימייל כבר רשום" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(passwordPlain);
    const user = await prisma.user.create({
      data: {
        name: nameResult.value,
        email: normalizedEmail,
        passwordHash,
        role: selectedRole,
      },
    });

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    const token = createSessionToken(authUser);
    await setSessionCookie(token);

    return NextResponse.json({ user: authUser }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
