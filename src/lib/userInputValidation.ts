/**
 * גבולות ותקינות לקלט משתמש בצד שרת (לפני שמירה ב-DB).
 */

import { NextResponse } from "next/server";
import {
  ISRAELI_MOBILE_PREFIXES,
  buildIsraeliPhone,
  isValidIsraeliMobilePhone,
} from "./israeliPhone";

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
  /** מספר טלפון ישראלי (ספרות בלבד, עד 10) */
  PHONE: 16,
  /** אולם / שירות — שם */
  VENUE_OR_SERVICE_NAME: 200,
  CITY: 100,
  DESCRIPTION_LONG: 20_000,
  FOOD_KASHRUT: 200,
  SERVICE_CATEGORY: 80,
  SERVICE_SHORT_DESC: 500,
  SERVICE_AREA_TEXT: 200,
  LANGUAGES_LINE: 300,
  RESPONSE_TIME_HINT: 120,
  OWNER_OR_PROVIDER_NOTE: 4000,
  /** שדה JSON מטופס (רשתות חברתיות, גלריה קיימת וכו׳) */
  JSON_FORM_FIELD: 100_000,
  PRICE_MAX: 2_147_483_647,
  EXPERIENCE_YEARS_MAX: 80,
  MAX_UPLOAD_IMAGE_BYTES: 5 * 1024 * 1024,
  MAX_SERVICE_GALLERY_FILES: 24,
  MAX_VENUE_GALLERY_FILES_TOTAL: 48,
  MAX_EVENT_TYPE_LABELS: 24,
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
/** טלפון ישראלי בהרשמה: קידומת מתוך הרשימה + 7 ספרות */
export function validateIsraeliPhoneRegister(
  prefixRaw: unknown,
  digitsRaw: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof prefixRaw !== "string" || typeof digitsRaw !== "string") {
    return { ok: false, error: "מספר טלפון לא תקין" };
  }
  const prefix = prefixRaw.trim();
  if (!ISRAELI_MOBILE_PREFIXES.includes(prefix)) {
    return { ok: false, error: "נא לבחור קידומת נייד תקנית (050–059)" };
  }
  const full = buildIsraeliPhone(prefix, digitsRaw);
  if (!isValidIsraeliMobilePhone(full)) {
    return {
      ok: false,
      error: "יש להזין 7 ספרות חוקיות אחרי הקידומת",
    };
  }
  if (full.length > USER_INPUT_MAX.PHONE) {
    return { ok: false, error: "מספר טלפון ארוך מדי" };
  }
  return { ok: true, value: full };
}

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

/** מחיר שלם או null (שדה ריק בטופס) */
export function validateNullablePriceInt(n: number | null): boolean {
  if (n === null) return true;
  return (
    Number.isInteger(n) &&
    n >= 0 &&
    n <= USER_INPUT_MAX.PRICE_MAX
  );
}

export function validateExperienceYearsInt(n: number | null): boolean {
  if (n === null) return true;
  return (
    Number.isInteger(n) &&
    n >= 0 &&
    n <= USER_INPUT_MAX.EXPERIENCE_YEARS_MAX
  );
}

function isAllowedImageMime(type: string): boolean {
  const t = type.toLowerCase();
  return (
    t === "image/jpeg" ||
    t === "image/jpg" ||
    t === "image/png" ||
    t === "image/webp"
  );
}

function isAllowedImageExt(name: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(name);
}

/** חתימות קובץ — JPEG / PNG / WebP */
export function validateImageMagicBytes(bytes: Uint8Array): string | null {
  if (bytes.length < 12) {
    return "יש להעלות תמונה בפורמט JPEG, PNG או WebP";
  }
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  if (!isJpeg && !isPng && !isWebp) {
    return "יש להעלות תמונה בפורמט JPEG, PNG או WebP";
  }
  return null;
}

/** תמונת JPEG/PNG/WebP עד 5MB — דורש MIME וסיומת תואמים */
export function validateUploadedImageFile(file: File): string | null {
  if (file.size <= 0) return "קובץ תמונה ריק";
  if (file.size > USER_INPUT_MAX.MAX_UPLOAD_IMAGE_BYTES) {
    return "גודל התמונה חורג מהמותר (עד 5MB)";
  }
  const mimeOk = isAllowedImageMime(file.type || "");
  const extOk = isAllowedImageExt(file.name || "");
  if (!mimeOk || !extOk) {
    return "יש להעלות תמונה בפורמט JPEG, PNG או WebP";
  }
  return null;
}

/** ולידציית מטא + חתימת קובץ */
export async function validateUploadedImageContent(
  file: File
): Promise<string | null> {
  const metaErr = validateUploadedImageFile(file);
  if (metaErr) return metaErr;
  const bytes = new Uint8Array(await file.arrayBuffer());
  return validateImageMagicBytes(bytes);
}

export function formDataJsonStringTooLong(
  entry: FormDataEntryValue | null,
  maxLen: number
): boolean {
  return typeof entry === "string" && entry.length > maxLen;
}

/** מגביל מספר פריטים ואורך כל תווית */
export function clampEventTypeLabels(types: string[]): string[] {
  return types
    .map((v) => v.slice(0, USER_INPUT_MAX.EVENT_TYPE_FREE).trim())
    .filter((v) => v.length > 0)
    .slice(0, USER_INPUT_MAX.MAX_EVENT_TYPE_LABELS);
}

export function validateGuestRange(
  minG: number | null,
  maxG: number | null
): string | null {
  if (minG !== null) {
    if (!validateGuestCount(minG)) return "מספר אורחים מינימלי לא תקין";
  }
  if (maxG !== null) {
    if (!validateGuestCount(maxG)) return "מספר אורחים מקסימלי לא תקין";
  }
  if (
    minG !== null &&
    maxG !== null &&
    minG > maxG
  ) {
    return "מינימום אורחים לא יכול להיות גדול מהמקסימום";
  }
  return null;
}

export function validatePriceMinMax(
  minP: number | null,
  maxP: number | null
): string | null {
  if (!validateNullablePriceInt(minP) || !validateNullablePriceInt(maxP)) {
    return "מחיר לא תקין";
  }
  if (
    minP !== null &&
    maxP !== null &&
    minP > maxP
  ) {
    return "מחיר מינימום לא יכול להיות גדול ממחיר מקסימום";
  }
  return null;
}
