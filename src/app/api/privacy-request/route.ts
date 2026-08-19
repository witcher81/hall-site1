import { NextRequest, NextResponse } from "next/server";
import { getSiteLegalInfo } from "@/lib/siteLegal";
import { sendEmail } from "@/lib/email";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { escapeHtml } from "@/lib/escapeHtml";
import { USER_FACING_EMAIL_FAILED } from "@/lib/userFacingErrors";

export const runtime = "nodejs";

const REQUEST_TYPES = new Set(["access", "rectify", "delete", "other"]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const requestType =
    typeof body.requestType === "string" ? body.requestType.trim() : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
  const details = typeof body.details === "string" ? body.details.trim().slice(0, 4000) : "";

  if (!REQUEST_TYPES.has(requestType) || !fullName || !email) {
    return NextResponse.json({ error: "חובה למלא את כל השדות הנדרשים" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "כתובת אימייל לא תקינה" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const captcha = await verifyTurnstileToken(body.turnstileToken, ip);
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error }, { status: 400 });
  }

  const typeLabel: Record<string, string> = {
    access: "עיון במידע",
    rectify: "תיקון מידע",
    delete: "מחיקת מידע",
    other: "אחר",
  };

  const legal = getSiteLegalInfo();
  const to = legal.privacyEmail ?? legal.supportEmail;
  if (!to) {
    return NextResponse.json({ error: USER_FACING_EMAIL_FAILED }, { status: 503 });
  }
  const sent = await sendEmail({
    to,
    replyTo: email,
    subject: `[תיקון 13] ${typeLabel[requestType] ?? requestType}`,
    html: `<div dir="rtl"><p><strong>סוג בקשה:</strong> ${escapeHtml(typeLabel[requestType] ?? requestType)}</p><p><strong>שם:</strong> ${escapeHtml(fullName)}</p><p><strong>אימייל:</strong> ${escapeHtml(email)}</p><p><strong>פרטים:</strong></p><pre style="white-space:pre-wrap">${details ? escapeHtml(details) : "(ללא)"}</pre></div>`,
    text: `סוג: ${typeLabel[requestType]}\nשם: ${fullName}\nאימייל: ${email}\n\n${details}`,
  });
  if (!sent.ok) {
    return NextResponse.json({ error: USER_FACING_EMAIL_FAILED }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
