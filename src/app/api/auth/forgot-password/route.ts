import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  PASSWORD_RESET_TOKEN_TTL_MS,
  createPasswordResetToken,
} from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/passwordResetEmail";
import { getSiteUrl } from "@/lib/siteUrl";
import { validateEmail } from "@/lib/userInputValidation";

const GENERIC_OK_MESSAGE =
  "אם קיים חשבון עם כתובת זו, ישלח אליו קישור לאיפוס הסיסמה.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { email } = (body ?? {}) as { email?: unknown };

    const emailResult = validateEmail(email);
    if (!emailResult.ok) {
      return NextResponse.json({ error: emailResult.error }, { status: 400 });
    }
    const normalizedEmail = emailResult.value;

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true },
    });

    if (user) {
      const rawToken = await createPasswordResetToken(user.id);
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
      const resetUrl = `${getSiteUrl()}/auth/reset-password?token=${rawToken}`;

      // שליחה סינכרונית כדי שב-Vercel הפונקציה לא "תקפא" לפני שהמייל נשלח.
      // לעולם לא חושפים אם המייל קיים — לכן גם שגיאה כאן מוחזרת כ-200 גנרי.
      const result = await sendPasswordResetEmail({
        to: user.email,
        name: user.name ?? null,
        resetUrl,
        expiresAt,
      });
      if (result.ok) {
        console.log(
          `[forgot-password] reset email sent to=${user.email} id=${result.id ?? "(none)"}`
        );
      } else if (result.skipped) {
        console.warn(
          `[forgot-password] email skipped (RESEND_API_KEY missing). to=${user.email}`
        );
      } else {
        console.error(
          `[forgot-password] email failed to=${user.email} error=${result.error}`
        );
      }

      // אופציונלי: webhook חיצוני נוסף (CRM/ספק חיצוני)
      const webhook = process.env.PASSWORD_RESET_WEBHOOK_URL?.trim();
      if (webhook) {
        try {
          const res = await fetch(webhook, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              event: "password_reset_requested",
              userId: user.id,
              email: user.email,
              name: user.name ?? null,
              resetUrl,
              expiresAt: expiresAt.toISOString(),
              sentAt: new Date().toISOString(),
            }),
          });
          if (!res.ok) {
            console.error(
              `[forgot-password] webhook failed status=${res.status}`
            );
          }
        } catch (err) {
          console.error("[forgot-password] webhook error:", err);
        }
      }
    } else {
      // לא חושפים שאין משתמש — מתעדים רק לצורך דיבאג בלוגים של Vercel
      console.log(
        `[forgot-password] no user for email=${normalizedEmail} (returning generic 200)`
      );
    }

    return NextResponse.json({ message: GENERIC_OK_MESSAGE }, { status: 200 });
  } catch (error) {
    console.error("forgot-password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
