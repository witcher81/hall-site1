import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { consumeQueueBatch, publishMessage } from "@/lib/messagingQueue";
import { MessageTypes } from "@/lib/messagingQueueTypes";
import {
  PASSWORD_RESET_TOKEN_TTL_MS,
  createPasswordResetToken,
} from "@/lib/passwordReset";
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

      await publishMessage(MessageTypes.PASSWORD_RESET_REQUESTED, {
        userId: user.id,
        email: user.email,
        name: user.name ?? null,
        resetUrl,
        expiresAt: expiresAt.toISOString(),
      });
      void consumeQueueBatch().catch((err) => {
        console.error("Background job kick failed after forgot-password:", err);
      });
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
