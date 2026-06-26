import { NextResponse } from "next/server";

import {
  getPendingVerificationUser,
  setPendingVerificationCookie,
} from "@/lib/auth";
import { sendEmailVerificationForUser } from "@/lib/sendEmailVerification";

const COOLDOWN_MS = 60_000;
const lastSentByUserId = new Map<number, number>();

export const runtime = "nodejs";

export async function POST() {
  try {
    const pending = await getPendingVerificationUser();
    if (!pending) {
      return NextResponse.json(
        { error: "פג תוקף ההמתנה. התחברו מחדש כדי לקבל קוד." },
        { status: 401 }
      );
    }

    const now = Date.now();
    const lastSent = lastSentByUserId.get(pending.id) ?? 0;
    if (now - lastSent < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - (now - lastSent)) / 1000);
      return NextResponse.json(
        { error: `נא להמתין ${waitSec} שניות לפני שליחה חוזרת.` },
        { status: 429 }
      );
    }

    const result = await sendEmailVerificationForUser({
      userId: pending.id,
      email: pending.email,
      name: pending.name,
    });

    lastSentByUserId.set(pending.id, now);
    await setPendingVerificationCookie(pending.id);

    if (!result.ok && !result.skipped) {
      return NextResponse.json(
        { error: "שליחת קוד האימות נכשלה. נסו שוב מאוחר יותר." },
        { status: 500 }
      );
    }

    const message = result.skipped
      ? "מייל לא נשלח (Resend לא מוגדר). בפיתוח — בדקו את הלוג."
      : "נשלח קוד אימות חדש לכתובת האימייל שלכם.";

    return NextResponse.json({
      message,
      devCode:
        process.env.NODE_ENV !== "production" ? result.devCode : undefined,
    });
  } catch (error) {
    console.error("resend-verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
