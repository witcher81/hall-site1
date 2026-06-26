import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getCurrentUser,
  setSessionCookie,
  setSessionCookieOnResponse,
  type AuthUser,
} from "@/lib/auth";
import {
  findValidVerificationTokenByRaw,
  isPlausibleVerificationToken,
  markVerificationTokenUsed,
} from "@/lib/emailVerification";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const rawToken =
      typeof body?.token === "string" ? body.token.trim() : "";

    if (!isPlausibleVerificationToken(rawToken)) {
      return NextResponse.json(
        { error: "קישור האימות אינו תקין או שפג תוקפו." },
        { status: 400 }
      );
    }

    const tokenRow = await findValidVerificationTokenByRaw(rawToken);
    if (!tokenRow) {
      return NextResponse.json(
        { error: "קישור האימות אינו תקין, פג תוקף, או כבר נוצל." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenRow.userId },
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
      return NextResponse.json(
        { error: "החשבון אינו זמין." },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      await markVerificationTokenUsed(tokenRow.id);
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: true,
      };
      const session = await getCurrentUser();
      if (session?.id === user.id) {
        const jwt = createSessionToken(authUser);
        await setSessionCookie(jwt);
        const res = NextResponse.json({ success: true, alreadyVerified: true });
        setSessionCookieOnResponse(res, jwt);
        return res;
      }
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    const marked = await markVerificationTokenUsed(tokenRow.id);
    if (!marked) {
      return NextResponse.json(
        { error: "קישור האימות כבר נוצל." },
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

    const session = await getCurrentUser();
    const res = NextResponse.json({ success: true, user: authUser });
    if (session?.id === user.id) {
      const jwt = createSessionToken(authUser);
      await setSessionCookie(jwt);
      setSessionCookieOnResponse(res, jwt);
    }
    return res;
  } catch (error) {
    console.error("verify-email error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
