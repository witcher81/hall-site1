import "server-only";

import { Resend } from "resend";

const OTP_TTL_MIN = 10;

/** תגובת שגיאה מ-Resend (לפי ה-SDK) — לשימוש במיפוי הודעות למשתמש */
type ResendApiError = {
  message: string;
  name: string;
  statusCode: number | null;
};

function isDevLog(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** הודעת משתמש בעברית לפי קוד השגיאה / טקסט מ-Resend */
function userMessageFromResendError(error: ResendApiError): string {
  const msg = error.message.toLowerCase();
  const name = error.name;

  if (
    name === "invalid_api_key" ||
    name === "missing_api_key" ||
    name === "restricted_api_key"
  ) {
    return "מפתח Resend לא תקין או חסר. בדוק את RESEND_API_KEY ב-Vercel.";
  }
  if (name === "invalid_from_address") {
    return "כתובת השולח לא מאומתת. ב-Resend יש לאמת דומיין ולהגדיר ב-Vercel את RESEND_FROM_EMAIL (למשל noreply@הדומיין-שלך).";
  }
  if (name === "daily_quota_exceeded" || name === "monthly_quota_exceeded") {
    return "מכסת המיילים ב-Resend נגמרה. נסה שוב מאוחר יותר.";
  }
  if (name === "rate_limit_exceeded") {
    return "יותר מדי ניסיונות שליחה. נסה שוב בעוד כמה דקות.";
  }
  if (name === "validation_error") {
    if (
      msg.includes("domain") ||
      msg.includes("from") ||
      msg.includes("recipient") ||
      msg.includes("only")
    ) {
      return "בפרודקשן חובה דומיין מאומת ב-Resend ו-RESEND_FROM_EMAIL מהדומיין. לא ניתן לשלוח מ-onboarding@resend.dev לכל כתובת.";
    }
  }
  if (
    msg.includes("domain") ||
    msg.includes("verify") ||
    (msg.includes("only") && msg.includes("email")) ||
    msg.includes("sandbox")
  ) {
    return "בפרודקשן חובה דומיין מאומת ב-Resend ו-RESEND_FROM_EMAIL ב-Vercel.";
  }
  return "שליחת האימייל נכשלה. נסה SMS או בדוק ב-Resend לוגים.";
}

export async function sendEmailOtp(
  to: string,
  code: string,
  variant: "email" | "gmail"
): Promise<{ ok: boolean; error?: string }> {
  const subject =
    variant === "gmail"
      ? "קוד אימות Gmail — Halls Hub"
      : "קוד אימות — Halls Hub";
  const html = `
    <p dir="rtl" style="font-family: system-ui, sans-serif;">
      קוד האימות שלך: <strong style="font-size: 1.25rem; letter-spacing: 0.2em;">${code}</strong>
    </p>
    <p dir="rtl" style="color:#666;font-size:14px;">הקוד תקף ${OTP_TTL_MIN} דקות. אם לא ביקשת אותו — התעלם מהודעה זו.</p>
  `;

  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";

  if (!key) {
    if (isDevLog()) {
      console.warn(
        `[sendVerificationCode] RESEND_API_KEY missing — dev OTP email to ${to}:`,
        code
      );
      return { ok: true };
    }
    return { ok: false, error: "שליחת אימייל לא מוגדרת (RESEND_API_KEY)" };
  }

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: `Halls Hub <${from}>`,
      to: [to],
      subject,
      html,
    });
    if (error) {
      console.error("Resend error:", JSON.stringify(error));
      return {
        ok: false,
        error: userMessageFromResendError(error as ResendApiError),
      };
    }
    return { ok: true };
  } catch (e) {
    console.error("Resend exception:", e);
    return { ok: false, error: "שליחת האימייל נכשלה (שגיאת רשת או שרת)." };
  }
}

export async function sendSmsOtp(
  phoneE164: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();

  if (!sid || !token || !from) {
    if (isDevLog()) {
      console.warn(
        `[sendVerificationCode] Twilio missing — dev OTP SMS to ${phoneE164}:`,
        code
      );
      return { ok: true };
    }
    return { ok: false, error: "שליחת SMS לא מוגדרת (Twilio)" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const body = new URLSearchParams({
    To: phoneE164,
    From: from,
    Body: `קוד האימות שלך ב-Halls Hub: ${code} (תקף ${OTP_TTL_MIN} דקות)`,
  });

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("Twilio SMS error:", res.status, t);
      return { ok: false, error: "שליחת SMS נכשלה" };
    }
    return { ok: true };
  } catch (e) {
    console.error("Twilio fetch:", e);
    return { ok: false, error: "שליחת SMS נכשלה" };
  }
}
