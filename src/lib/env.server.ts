import "server-only";

/**
 * קריאה מרוכזת לסודות בצד שרת בלבד (לא דרך NEXT_PUBLIC_*).
 * Prisma קורא DATABASE_URL ישירות מ-process.env — נשאר כך; כאן רק עוזרים לשאר הקוד.
 */

const FORBIDDEN_NEXT_PUBLIC = [
  "NEXT_PUBLIC_DATABASE_URL",
  "NEXT_PUBLIC_JWT_SECRET",
  "NEXT_PUBLIC_UPSTASH_REDIS_REST_URL",
  "NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN",
  "NEXT_PUBLIC_WEBHOOK_INBOUND_SECRET",
] as const;

/** הרצה פעם אחת בהפעלת השרת — מונע טעות שמדליפה סוד ל-bundle הדפדפן */
export function assertNoSecretExposedAsPublicEnv(): void {
  for (const key of FORBIDDEN_NEXT_PUBLIC) {
    if (process.env[key]?.trim()) {
      throw new Error(
        `אסור להגדיר ${key} — קידומת NEXT_PUBLIC_ חושפת את הערך בדפדפן. השתמש במשתנה בלי הקידומת (רק ב-Vercel / .env שרת).`
      );
    }
  }
}
