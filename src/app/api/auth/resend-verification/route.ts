import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { sendEmailVerificationForUser } from "@/lib/sendEmailVerification";

const COOLDOWN_MS = 60_000;
const lastSentByUserId = new Map<number, number>();

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.emailVerified) {
      return NextResponse.json(
        { error: "כתובת האימייל כבר מאומתת." },
        { status: 400 }
      );
    }

    const now = Date.now();
    const lastSent = lastSentByUserId.get(session.id) ?? 0;
    if (now - lastSent < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - (now - lastSent)) / 1000);
      return NextResponse.json(
        { error: `נא להמתין ${waitSec} שניות לפני שליחה חוזרת.` },
        { status: 429 }
      );
    }

    const result = await sendEmailVerificationForUser({
      userId: session.id,
      email: session.email,
      name: session.name,
    });

    lastSentByUserId.set(session.id, now);

    if (!result.ok && !result.skipped) {
      return NextResponse.json(
        { error: "שליחת מייל האימות נכשלה. נסו שוב מאוחר יותר." },
        { status: 500 }
      );
    }

    const message = result.skipped
      ? "מייל האימות לא נשלח (Resend לא מוגדר). בפיתוח — בדקו את הלוג."
      : "נשלח מייל אימות לכתובת שלכם.";

    return NextResponse.json({
      message,
      devVerifyUrl:
        process.env.NODE_ENV !== "production" ? result.verifyUrl : undefined,
    });
  } catch (error) {
    console.error("resend-verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
