import "server-only";

/** קודי שגיאה לשליחת מייל — לתגובות API ולוגים */
export type EmailSendErrorCode =
  | "missing_api_key"
  | "resend_sandbox"
  | "from_not_verified"
  | "restricted_api_key"
  | "invalid_from"
  | "unknown";

export function stripEnvQuotes(value: string): string {
  const v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1).trim();
  }
  return v;
}

export const RESEND_SANDBOX_FROM = "Halls Hub <onboarding@resend.dev>";

export function normalizeEmailFrom(raw: string): string {
  const v = stripEnvQuotes(raw);
  if (!v) return RESEND_SANDBOX_FROM;
  // כתובת בלבד — עטיפה בשם תצוגה
  if (/^[^\s<>]+@[^\s<>]+$/.test(v)) {
    return `Halls Hub <${v}>`;
  }
  return v;
}

export function getEmailFrom(): string {
  const fromEnv = process.env.EMAIL_FROM?.trim();
  if (fromEnv) return normalizeEmailFrom(fromEnv);
  return RESEND_SANDBOX_FROM;
}

export function usesResendSandboxFrom(from: string): boolean {
  return /@resend\.dev\s*>?\s*$/i.test(from) || from.includes("@resend.dev");
}

export function isProductionEmailFromReady(): boolean {
  const fromEnv = process.env.EMAIL_FROM?.trim();
  if (!fromEnv) return false;
  return !usesResendSandboxFrom(normalizeEmailFrom(fromEnv));
}

export function classifyResendErrorMessage(
  error: string
): EmailSendErrorCode {
  const lower = error.toLowerCase();
  if (lower.includes("missing") && lower.includes("resend")) {
    return "missing_api_key";
  }
  if (
    lower.includes("only send testing emails") ||
    lower.includes("your own email address")
  ) {
    return "resend_sandbox";
  }
  if (
    lower.includes("domain") &&
    (lower.includes("verify") ||
      lower.includes("verified") ||
      lower.includes("not found"))
  ) {
    return "from_not_verified";
  }
  if (lower.includes("restricted") && lower.includes("api key")) {
    return "restricted_api_key";
  }
  if (lower.includes("invalid") && lower.includes("from")) {
    return "invalid_from";
  }
  return "unknown";
}

export function userFacingEmailSendError(
  code: EmailSendErrorCode
): string {
  switch (code) {
    case "missing_api_key":
      return "שליחת מייל לא מוגדרת בשרת (RESEND_API_KEY).";
    case "resend_sandbox":
      return "כתובת השולח היא resend.dev — ניתן לשלוח רק לכתובת חשבון Resend. יש לאמת דומיין ב-Resend ולהגדיר EMAIL_FROM ב-Vercel.";
    case "from_not_verified":
      return "דומיין השולח (EMAIL_FROM) לא מאומת ב-Resend. היכנסו ל-Resend → Domains, אמתו DNS, ועדכנו EMAIL_FROM.";
    case "restricted_api_key":
      return "מפתח Resend מוגבל — נדרש Full access לשליחת מיילים.";
    case "invalid_from":
      return "כתובת השולח (EMAIL_FROM) לא תקינה. דוגמה: Halls Hub <noreply@yourdomain.com>";
    default:
      return "שליחת המייל נכשלה. נסו שוב מאוחר יותר.";
  }
}

/**
 * חשיפת קוד/קישור על המסך כששליחת מייל נכשלה.
 *
 * לפני השקה (אין EMAIL_FROM מאומת): הקוד מוצג בדף האימות.
 * אחרי שהמיילים עובדים בפרוד: הגדירו DISABLE_EMAIL_VERIFY_CODE_FALLBACK=true ב-Vercel.
 */
export function shouldExposeVerificationCodeOnFailure(
  errorCode: EmailSendErrorCode | undefined
): boolean {
  if (!errorCode) return false;
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.DISABLE_EMAIL_VERIFY_CODE_FALLBACK === "true") {
    return false;
  }
  if (!isProductionEmailFromReady()) return true;
  return (
    errorCode === "resend_sandbox" ||
    errorCode === "from_not_verified" ||
    errorCode === "invalid_from" ||
    errorCode === "missing_api_key"
  );
}

export function isEmailVerifyCodeFallbackActive(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.DISABLE_EMAIL_VERIFY_CODE_FALLBACK === "true") return false;
  return !isProductionEmailFromReady();
}

export function isRecoverableFromAddressError(
  code: EmailSendErrorCode
): boolean {
  return (
    code === "from_not_verified" ||
    code === "invalid_from" ||
    code === "unknown"
  );
}
