import { isProductionRuntime } from "@/lib/isProduction";
import { getUpstashRedisConfig } from "@/lib/upstashEnv";

export type ProductionHealthReport = {
  ok: boolean;
  production: boolean;
  rateLimitConfigured: boolean;
  cronConfigured: boolean;
  databaseConfigured: boolean;
  jwtConfigured: boolean;
  emailConfigured: boolean;
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
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const geocodeFallbackConfigured = Boolean(
    process.env.GOOGLE_GEOCODING_API_KEY?.trim()
  );

  const warnings: string[] = [];
  if (production) {
    if (!rateLimitConfigured) {
      warnings.push(
        "UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN — חובה בפרוד; /api מחזיר 503 בלי זה."
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
  }

  const ok =
    !production ||
    (rateLimitConfigured &&
      cronConfigured &&
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
    blobConfigured,
    geocodeFallbackConfigured,
    warnings,
  };
}
