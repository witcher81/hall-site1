/**
 * גבולות ותקינות לקלט משתמש בצד שרת (לפני שמירה ב-DB).
 */

import { NextResponse } from "next/server";

export const USER_INPUT_MAX = {
  EMAIL: 254,
  DISPLAY_NAME: 120,
  BUSINESS_NAME: 200,
  ADDRESS: 500,
  /** bcrypt מוגבל ל־72 בתים — חובה לאכוף כדי שלא יהיו התאמות מפתיעות */
  PASSWORD_BYTES: 72,
  PASSWORD_MIN: 6,
  CHAT_MESSAGE: 8000,
  INQUIRY_MESSAGE: 4000,
  SERVICE_REQUEST_MESSAGE: 4000,
  REVIEW_COMMENT: 2000,
  AUTO_REPLY: 2000,
  EVENT_PLAN_TITLE: 200,
  EVENT_PLAN_NOTES: 8000,
  EVENT_TYPE_FREE: 80,
  AREA: 120,
  DATE_STRING: 32,
  GUEST_COUNT_MAX: 100_000,
} as const;

function isReasonableEmailShape(s: string): boolean {
  if (s.length > USER_INPUT_MAX.EMAIL) return false;
  const at = s.lastIndexOf("@");
  if (at < 1 || at === s.length - 1) return false;
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  if (local.length > 64 || domain.length > 253) return false;
  if (!domain.includes(".")) return false;
  if (/\s/.test(s)) return false;
  return true;
}

export function passwordUtf8ByteLength(password: string): number {
  return Buffer.byteLength(password, "utf8");
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** אימייל מנורמל (אותיות קטנות, ללא רווחים בקצוות) */
export function validateEmail(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string") {
    return { ok: false, error: "פורמט אימייל לא תקין" };
  }
  const t = raw.trim().toLowerCase();
  if (!t) {
    return { ok: false, error: "נדרש אימייל" };
  }
  if (t.length > USER_INPUT_MAX.EMAIL) {
    return { ok: false, error: "אימייל ארוך מדי" };
  }
  if (!isReasonableEmailShape(t)) {
    return { ok: false, error: "פורמט אימייל לא תקין" };
  }
  return { ok: true, value: t };
}

/** סיסמה להתחברות / הרשמה */
export function validateNewPassword(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string") {
    return { ok: false, error: "סיסמה לא תקינה" };
  }
  if (raw.length < USER_INPUT_MAX.PASSWORD_MIN) {
    return { ok: false, error: "הסיסמה חייבת להכיל לפחות 6 תווים" };
  }
  if (passwordUtf8ByteLength(raw) > USER_INPUT_MAX.PASSWORD_BYTES) {
    return { ok: false, error: "הסיסמה ארוכה מדי (מקסימום 72 בתים)" };
  }
  return { ok: true, value: raw };
}

export function validateLoginPassword(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string" || !raw) {
    return { ok: false, error: "נדרשת סיסמה" };
  }
  if (passwordUtf8ByteLength(raw) > USER_INPUT_MAX.PASSWORD_BYTES) {
    return { ok: false, error: "פורמט לא תקין" };
  }
  return { ok: true, value: raw };
}

/** שם תצוגה / עסק — ריק מותר כ-null */
export function validateOptionalShortText(
  raw: unknown,
  maxLen: number,
  fieldLabel: string
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw == null || raw === "") {
    return { ok: true, value: null };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: `${fieldLabel}: פורמט לא תקין` };
  }
  const t = raw.trim();
  if (!t) return { ok: true, value: null };
  if (t.length > maxLen) {
    return { ok: false, error: `${fieldLabel} ארוך מדי` };
  }
  return { ok: true, value: t };
}

/** מחרוזת חובה אחרי trim */
export function validateRequiredText(
  raw: unknown,
  maxLen: number,
  minLen: number,
  fieldLabel: string
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string") {
    return { ok: false, error: `${fieldLabel}: פורמט לא תקין` };
  }
  const t = raw.trim();
  if (t.length < minLen) {
    return { ok: false, error: `${fieldLabel} קצר מדי` };
  }
  if (t.length > maxLen) {
    return { ok: false, error: `${fieldLabel} ארוך מדי` };
  }
  return { ok: true, value: t };
}

/** טקסט ארוך אופציונלי (הערות, הודעה) — ריק => null */
export function validateOptionalLongText(
  raw: unknown,
  maxLen: number,
  fieldLabel: string
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw == null) return { ok: true, value: null };
  if (typeof raw !== "string") {
    return { ok: false, error: `${fieldLabel}: פורמט לא תקין` };
  }
  const t = raw.trim();
  if (!t) return { ok: true, value: null };
  if (t.length > maxLen) {
    return { ok: false, error: `${fieldLabel} ארוך מדי` };
  }
  return { ok: true, value: t };
}

export function validateGuestCount(n: number | null): boolean {
  if (n == null || !Number.isFinite(n)) return false;
  if (!Number.isInteger(n)) return false;
  return n >= 1 && n <= USER_INPUT_MAX.GUEST_COUNT_MAX;
}
