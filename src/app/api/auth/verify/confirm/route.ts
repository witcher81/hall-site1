import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  clearPendingVerificationCookie,
  createSessionToken,
  getPendingVerificationUserId,
  setSessionCookie,
  type AuthUser,
} from "@/lib/auth";
import { verifyOtpCode } from "@/lib/verificationOtpCrypto";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const uid = await getPendingVerificationUserId();
  if (!uid) {
    return NextResponse.json({ error: "נדרשת הרשמה או התחברות" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const raw = typeof body.code === "string" ? body.code.trim() : "";
  if (!/^\d{6}$/.test(raw)) {
    return NextResponse.json({ error: "נא להזין 6 ספרות" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }
  if (user.emailVerified) {
    await clearPendingVerificationCookie();
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const otp = await prisma.verificationOtp.findFirst({
    where: {
      userId: uid,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return NextResponse.json(
      { error: "אין קוד פעיל — שלח קוד מחדש" },
      { status: 400 }
    );
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await prisma.verificationOtp.deleteMany({ where: { userId: uid } });
    return NextResponse.json(
      { error: "יותר מדי ניסיונות — שלח קוד חדש" },
      { status: 400 }
    );
  }

  const ok = verifyOtpCode(uid, raw, otp.codeHash);
  if (!ok) {
    await prisma.verificationOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ error: "קוד שגוי" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: uid },
      data: { emailVerified: true },
    }),
    prisma.verificationOtp.deleteMany({ where: { userId: uid } }),
  ]);

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: true,
  };
  const token = createSessionToken(authUser);
  await setSessionCookie(token);
  await clearPendingVerificationCookie();

  return NextResponse.json({ ok: true, user: authUser });
}
