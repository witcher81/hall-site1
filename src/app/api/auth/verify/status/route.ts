import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPendingVerificationUserId } from "@/lib/auth";

export const runtime = "nodejs";

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  return `${local.slice(0, 2)}•••@${domain}`;
}

function maskPhone(phone: string | null): string | null {
  if (!phone || phone.length < 4) return null;
  return `••••${phone.slice(-4)}`;
}

/** מידע ממוסך לדף אימות (רק עם עוגיית pending תקפה) */
export async function GET() {
  const uid = await getPendingVerificationUserId();
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      email: true,
      phone: true,
      emailVerified: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ alreadyVerified: true });
  }

  const email = user.email.toLowerCase();
  return NextResponse.json({
    emailMasked: maskEmail(user.email),
    phoneMasked: maskPhone(user.phone),
    canEmail: true,
    canSms: Boolean(user.phone),
    canGmail: email.endsWith("@gmail.com") || email.endsWith("@googlemail.com"),
  });
}
