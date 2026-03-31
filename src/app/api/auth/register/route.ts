import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";

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

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
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
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name?.trim() || null,
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
