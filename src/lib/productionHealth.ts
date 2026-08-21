import { isProductionRuntime } from "@/lib/isProduction";
import {
  isEmailVerificationDisabled,
  isEmailVerifyCodeFallbackActive,
  isProductionEmailFromReady,
} from "@/lib/emailConfig";
import { getUpstashRedisConfig } from "@/lib/upstashEnv";

export type ProductionHealthReport = {
  ok: boolean;
  production: boolean;
  rateLimitConfigured: boolean;
  cronConfigured: boolean;
  databaseConfigured: boolean;
  jwtConfigured: boolean;
  emailConfigured: boolean;
  /** EMAIL_FROM עם דומיין מאומת (לא resend.dev) — נדרש לשליחה לכל נמען */
  emailFromProductionReady: boolean;
  /** קוד OTP מוצג על המסך כשהמייל נכשל (מצב לפני השקה) */
  emailVerifyCodeOnScreenFallback: boolean;
  /** OTP אימייל כבוי (DISABLE_EMAIL_VERIFICATION) */
  emailVerificationDisabled: boolean;
  blobConfigured: boolean;
  geocodeFallbackConfigured: boolean;
  /** רמזים לתצורה חסרה — ללא ערכי סוד */
  warnings: string[];
};

function jwtConfiguredForRuntime(): boolean {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret === "dev-secret-change-me") return false;
  const minLen = process.env.VERCEL === "1" ? 32 : 16;
  return secret.length >= minLen;
}

/**
 * בדיקת משתני סביבה לפרוד (Edge-safe — ללא גישה ל-DB).
 * משמש `/api/health` וניטור אחרי deploy.
 */
export function buildProductionHealthReport(): ProductionHealthReport {
  const production = isProductionRuntime();
  const rateLimitConfigured = Boolean(getUpstashRedisConfig());
  const cronConfigured =
    !production || Boolean(process.env.CRON_SECRET?.trim());
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const jwtConfigured = !production || jwtConfiguredForRuntime();
  const emailConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  const emailFromProductionReady =
    !production || !emailConfigured || isProductionEmailFromReady();
  const emailVerifyCodeOnScreenFallback =
    !production || isEmailVerifyCodeFallbackActive();
  const emailVerificationDisabled = isEmailVerificationDisabled();
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const geocodeFallbackConfigured = Boolean(
    process.env.GOOGLE_GEOCODING_API_KEY?.trim()
  );

  const warnings: string[] = [];
  if (production) {
    if (!rateLimitConfigured) {
      warnings.push(
        "UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN — מומלץ בפרוד; בלי זה הגבלת קצב מקומית בלבד."
      );
    }
    if (!cronConfigured) {
      warnings.push(
        "CRON_SECRET — תור מיילים ומשימות רקע לא ירוץ בלי זה."
      );
    }
    if (!databaseConfigured) {
      warnings.push("DATABASE_URL — חובה (Neon / PostgreSQL).");
    }
    if (!jwtConfigured) {
      warnings.push(
        "JWT_SECRET — חובה בפרוד (לפחות 32 תווים ב-Vercel)."
      );
    }
    if (!emailConfigured) {
      warnings.push(
        "RESEND_API_KEY — אופציונלי; בלי זה אין מיילים (איפוס סיסמה, פניות)."
      );
    } else if (!emailFromProductionReady && !emailVerificationDisabled) {
      warnings.push(
        "EMAIL_FROM — חסר או משתמש ב-resend.dev; אימות אימייל ומיילים ייכשלו לנמענים אחרים. אמתו דומיין ב-Resend והגדירו EMAIL_FROM (למשל EventForYou <noreply@yourdomain.com>)."
      );
    }
    if (emailVerificationDisabled) {
      warnings.push(
        "DISABLE_EMAIL_VERIFICATION=true — הרשמה בלי קוד במייל. החזירו כשיהיה דומיין מאומת ב-Resend."
      );
    }
    if (emailVerifyCodeOnScreenFallback) {
      warnings.push(
        "ENABLE_EMAIL_VERIFY_CODE_FALLBACK=true — קוד אימות / קישור איפוס מוצגים על המסך כשהמייל נכשל. בטלו לפני השקה ציבורית (או הגדירו DISABLE_EMAIL_VERIFY_CODE_FALLBACK=true)."
      );
    }
    if (!blobConfigured) {
      warnings.push(
        "BLOB_READ_WRITE_TOKEN — חובה להעלאת תמונות ב-Vercel."
      );
    }
    if (!geocodeFallbackConfigured) {
      warnings.push(
        "GOOGLE_GEOCODING_API_KEY — אופציונלי; גיבוי לגיאוקוד כש-ArcGIS לא מספיק."
      );
    }
    if (
      !process.env.TURNSTILE_SECRET_KEY?.trim() ||
      !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
    ) {
      warnings.push(
        "TURNSTILE_SECRET_KEY + NEXT_PUBLIC_TURNSTILE_SITE_KEY — חובה בפרוד (לוגין, הרשמה, איפוס סיסמה, צור קשר)."
      );
    }
    if (process.env.ALLOW_DEV_USER_SWITCH === "true") {
      warnings.push(
        "ALLOW_DEV_USER_SWITCH=true — סיכון: החלפת משתמש ללא אימות בפרוד. בטל אלא אם מכוון."
      );
    }
  }

  const ok =
    !production ||
    (cronConfigured &&
      databaseConfigured &&
      jwtConfigured);

  return {
    ok,
    production,
    rateLimitConfigured,
    cronConfigured,
    databaseConfigured,
    jwtConfigured,
    emailConfigured,
    emailFromProductionReady,
    emailVerifyCodeOnScreenFallback,
    emailVerificationDisabled,
    blobConfigured,
    geocodeFallbackConfigured,
    warnings,
  };
}
