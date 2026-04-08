import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPendingVerificationUserId } from "@/lib/auth";
import { generateSixDigitCode, hashOtpCode } from "@/lib/verificationOtpCrypto";
import { sendEmailOtp, sendSmsOtp } from "@/lib/sendVerificationCode";

export const runtime = "nodejs";

const OTP_EXPIRES_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_15_MIN = 5;

type Channel = "email" | "sms" | "gmail";

function toE164Israel(phoneDigits: string): string {
  const d = phoneDigits.replace(/\D/g, "");
  if (d.startsWith("0")) return `+972${d.slice(1)}`;
  return `+972${d}`;
}

export async function POST(req: NextRequest) {
  const uid = await getPendingVerificationUserId();
  if (!uid) {
    return NextResponse.json({ error: "נדרשת הרשמה או התחברות" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user || user.emailVerified) {
    return NextResponse.json({ error: "לא נמצא או כבר מאומת" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as { channel?: string };
  const channel = body.channel as Channel | undefined;
  if (channel !== "email" && channel !== "sms" && channel !== "gmail") {
    return NextResponse.json({ error: "ערוץ לא תקין" }, { status: 400 });
  }

  const emailLower = user.email.toLowerCase();
  if (channel === "gmail") {
    if (!emailLower.endsWith("@gmail.com") && !emailLower.endsWith("@googlemail.com")) {
      return NextResponse.json(
        { error: "אימות Gmail זמין רק לכתובת Gmail" },
        { status: 400 }
      );
    }
  }
  if (channel === "sms") {
    if (!user.phone) {
      return NextResponse.json({ error: "אין מספר טלפון בחשבון" }, { status: 400 });
    }
  }

  const since = new Date(Date.now() - 15 * 60 * 1000);
  const recent = await prisma.verificationOtp.count({
    where: { userId: uid, createdAt: { gte: since } },
  });
  if (recent >= MAX_SENDS_PER_15_MIN) {
    return NextResponse.json(
      { error: "נשלחו יותר מדי קודים. נסה שוב בעוד כמה דקות." },
      { status: 429 }
    );
  }

  await prisma.verificationOtp.deleteMany({ where: { userId: uid } });

  const code = generateSixDigitCode();
  const codeHash = hashOtpCode(uid, code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MS);

  await prisma.verificationOtp.create({
    data: {
      userId: uid,
      codeHash,
      channel,
      expiresAt,
    },
  });

  if (channel === "sms") {
    const e164 = toE164Israel(user.phone!);
    const r = await sendSmsOtp(e164, code);
    if (!r.ok) {
      await prisma.verificationOtp.deleteMany({ where: { userId: uid } });
      return NextResponse.json({ error: r.error ?? "שגיאת SMS" }, { status: 503 });
    }
  } else {
    const variant = channel === "gmail" ? "gmail" : "email";
    const r = await sendEmailOtp(user.email, code, variant);
    if (!r.ok) {
      await prisma.verificationOtp.deleteMany({ where: { userId: uid } });
      return NextResponse.json({ error: r.error ?? "שגיאת אימייל" }, { status: 503 });
    }
  }

  return NextResponse.json({ ok: true, channel });
}
