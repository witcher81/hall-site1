import { NextRequest, NextResponse } from "next/server";
import { getSiteLegalInfo } from "@/lib/siteLegal";
import { sendEmail } from "@/lib/email";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { escapeHtml } from "@/lib/escapeHtml";
import { USER_FACING_EMAIL_FAILED } from "@/lib/userFacingErrors";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
  const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 200) : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 4000) : "";

  if (!name || !email || !message) {
    return NextResponse.json({ error: "חובה למלא שם, אימייל והודעה" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "כתובת אימייל לא תקינה" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const captcha = await verifyTurnstileToken(body.turnstileToken, ip);
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error }, { status: 400 });
  }

  const legal = getSiteLegalInfo();
  if (!legal.supportEmail) {
    return NextResponse.json({ error: USER_FACING_EMAIL_FAILED }, { status: 503 });
  }
  const subj = subject || "פנייה מהאתר";
  const sent = await sendEmail({
    to: legal.supportEmail,
    replyTo: email,
    subject: `[EventForYou] ${subj}`,
    html: `<div dir="rtl"><p><strong>מאת:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p><strong>נושא:</strong> ${escapeHtml(subj)}</p><hr/><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre></div>`,
    text: `מאת: ${name} <${email}>\nנושא: ${subj}\n\n${message}`,
  });
  if (!sent.ok) {
    return NextResponse.json({ error: USER_FACING_EMAIL_FAILED }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
