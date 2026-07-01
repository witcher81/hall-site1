import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateEmail } from "@/lib/userInputValidation";
import {
  passwordResetClientPayload,
  sendPasswordResetForUser,
} from "@/lib/sendPasswordReset";
import { verifyTurnstileToken } from "@/lib/turnstile";

function forgotPasswordSuccessMessage(
  email: string,
  clientPayload?: ReturnType<typeof passwordResetClientPayload>
): string {
  if (clientPayload?.resetUrl && !clientPayload.emailSent) {
    return "לא ניתן לשלוח מייל כרגע — השתמשו בקישור למטה כדי לאפס את הסיסמה.";
  }
  return `שלחנו קישור לאיפוס סיסמה ל־${email}. בדקו את תיבת הדואר (וגם ספאם). הקישור תקף לשעה.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { email, turnstileToken } = (body ?? {}) as {
      email?: unknown;
      turnstileToken?: unknown;
    };

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const captcha = await verifyTurnstileToken(
      typeof turnstileToken === "string" ? turnstileToken : undefined,
      ip
    );
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

    const emailResult = validateEmail(email);
    if (!emailResult.ok) {
      return NextResponse.json({ error: emailResult.error }, { status: 400 });
    }
    const normalizedEmail = emailResult.value;

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true },
    });

    let clientPayload: ReturnType<typeof passwordResetClientPayload> | undefined;

    if (user) {
      const sendResult = await sendPasswordResetForUser({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
      clientPayload = passwordResetClientPayload(sendResult);

      const webhook = process.env.PASSWORD_RESET_WEBHOOK_URL?.trim();
      if (webhook && sendResult.resetUrl) {
        try {
          const res = await fetch(webhook, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              event: "password_reset_requested",
              userId: user.id,
              email: user.email,
              name: user.name ?? null,
              resetUrl: sendResult.resetUrl,
              emailSent: sendResult.ok,
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
      console.log(
        `[forgot-password] no user for email=${normalizedEmail} (returning generic 200)`
      );
    }

    const message = forgotPasswordSuccessMessage(
      normalizedEmail,
      clientPayload
    );

    return NextResponse.json({
      message,
      ...(clientPayload ?? { emailSent: true }),
    });
  } catch (error) {
    console.error("forgot-password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
