import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  hashPassword,
} from "@/lib/auth";
import {
  findValidResetTokenByRaw,
  isPlausibleRawToken,
  markResetTokenUsed,
} from "@/lib/passwordReset";
import { validateNewPassword } from "@/lib/userInputValidation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { token, password } = (body ?? {}) as {
      token?: unknown;
      password?: unknown;
    };

    if (!isPlausibleRawToken(token)) {
      return NextResponse.json(
        { error: "קישור איפוס לא תקין או שפג תוקפו" },
        { status: 400 }
      );
    }

    const passResult = validateNewPassword(password);
    if (!passResult.ok) {
      return NextResponse.json({ error: passResult.error }, { status: 400 });
    }
    const newPasswordPlain = passResult.value;

    const valid = await findValidResetTokenByRaw(token);
    if (!valid) {
      return NextResponse.json(
        { error: "קישור איפוס לא תקין או שפג תוקפו" },
        { status: 400 }
      );
    }

    const claimed = await markResetTokenUsed(valid.id);
    if (!claimed) {
      return NextResponse.json(
        { error: "קישור איפוס לא תקין או שפג תוקפו" },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPasswordPlain);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: valid.userId },
        data: { passwordHash: newHash },
      }),
      // ביטול כל טוקני האיפוס הפעילים הנותרים למשתמש
      prisma.passwordResetToken.updateMany({
        where: { userId: valid.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    // נקה את הסשן הנוכחי כדי לאלץ התחברות מחדש עם הסיסמה החדשה
    await clearSessionCookie();

    return NextResponse.json(
      { message: "הסיסמה עודכנה בהצלחה" },
      { status: 200 }
    );
  } catch (error) {
    console.error("reset-password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
