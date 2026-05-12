import "server-only";

import { Resend } from "resend";

let cachedResend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!cachedResend) cachedResend = new Resend(key);
  return cachedResend;
}

/**
 * כתובת השולח. ברירת מחדל: `onboarding@resend.dev` (מאומת ע״י Resend, מתאים לבדיקות).
 * בפרודקשן אמיתית — להגדיר `EMAIL_FROM` עם דומיין מאומת בחשבון Resend
 * (Resend Dashboard → Domains → Add Domain → DNS records).
 */
export function getEmailFrom(): string {
  const fromEnv = process.env.EMAIL_FROM?.trim();
  if (fromEnv) return fromEnv;
  return "Halls Hub <onboarding@resend.dev>";
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** דורש דומיין מאומת ב-Resend כדי לעבוד; אופציונלי */
  replyTo?: string;
};

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string; skipped?: boolean };

/**
 * שולח מייל דרך Resend.
 * - בלי `RESEND_API_KEY` → לא שולח. בפיתוח: מדפיס לקונסולה כדי שתוכל לראות את הקישור.
 *   בפרודקשן: רק אזהרה (לא קורס) כדי שלא לחסום זרימות שעדיין מנסות לעבוד.
 * - לעולם לא זורק חריגה — מחזיר תוצאה ידידותית.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const client = getResend();
  if (!client) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[email] RESEND_API_KEY לא מוגדר — מדלג על שליחה.\nTo: ${input.to}\nSubject: ${input.subject}\nText: ${input.text ?? "(html only)"}\n`
      );
    } else {
      console.warn(
        "[email] RESEND_API_KEY לא מוגדר בפרודקשן — מייל לא יישלח (to=" + input.to + ", subject=" + input.subject + ")"
      );
    }
    return { ok: false, error: "RESEND_API_KEY missing", skipped: true };
  }

  try {
    const { data, error } = await client.emails.send({
      from: getEmailFrom(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });
    if (error) {
      console.error("[email] Resend send error:", error);
      return { ok: false, error: error.message || "Resend send failed" };
    }
    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    console.error("[email] Unexpected Resend error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}
