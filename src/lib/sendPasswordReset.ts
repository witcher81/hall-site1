import "server-only";

import {
  PASSWORD_RESET_TOKEN_TTL_MS,
  createPasswordResetToken,
} from "./passwordReset";
import { sendPasswordResetEmail } from "./passwordResetEmail";
import { buildPasswordResetUrl } from "./passwordResetUrl";
import { getSiteUrl } from "./siteUrl";
import {
  shouldExposeVerificationCodeOnFailure,
  userFacingEmailSendError,
  type EmailSendErrorCode,
} from "./emailConfig";

type SendPasswordResetInput = {
  userId: number;
  email: string;
  name: string | null;
  siteUrl?: string;
};

export type SendPasswordResetResult = {
  ok: boolean;
  resetUrl?: string;
  skipped?: boolean;
  error?: string;
  errorCode?: EmailSendErrorCode;
  userMessage?: string;
};

/** שדות JSON ללקוח אחרי forgot-password */
export function passwordResetClientPayload(
  result: SendPasswordResetResult
): {
  emailSent: boolean;
  resetUrl?: string;
  emailWarning?: string;
  emailErrorCode?: EmailSendErrorCode;
} {
  if (result.ok) {
    return { emailSent: true };
  }
  const exposeLink =
    Boolean(result.resetUrl) &&
    (result.skipped ||
      shouldExposeVerificationCodeOnFailure(result.errorCode));
  return {
    emailSent: false,
    resetUrl: exposeLink ? result.resetUrl : undefined,
    emailWarning:
      result.userMessage ??
      (result.skipped
        ? "מייל לא נשלח (Resend לא מוגדר). הקישור מוצג בדף לצורך המשך."
        : "שליחת קישור האיפוס נכשלה. נסו שוב או השתמשו בקישור שמוצג בדף."),
    emailErrorCode: result.errorCode,
  };
}

/** יוצר טוקן איפוס ושולח במייל */
export async function sendPasswordResetForUser(
  input: SendPasswordResetInput
): Promise<SendPasswordResetResult> {
  const rawToken = await createPasswordResetToken(input.userId);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
  const siteUrl = input.siteUrl ?? getSiteUrl();
  const resetUrl = buildPasswordResetUrl(siteUrl, rawToken);

  const result = await sendPasswordResetEmail({
    to: input.email,
    name: input.name,
    resetUrl,
    expiresAt,
  });

  if (result.ok) {
    console.log(
      `[password-reset] link sent to=${input.email} id=${result.id ?? "(none)"} from=${result.from}`
    );
    return { ok: true, resetUrl };
  }

  if (result.skipped) {
    console.warn(
      `[password-reset] skipped (RESEND_API_KEY missing). to=${input.email}`
    );
    if (process.env.NODE_ENV !== "production") {
      console.log(`[password-reset] dev reset url: ${resetUrl}`);
    }
    const exposeLink = shouldExposeVerificationCodeOnFailure(
      result.errorCode ?? "missing_api_key"
    );
    return {
      ok: false,
      ...(exposeLink ? { resetUrl } : {}),
      skipped: true,
      errorCode: result.errorCode,
      userMessage: userFacingEmailSendError(result.errorCode),
    };
  }

  console.error(
    `[password-reset] failed to=${input.email} from=${result.from ?? "?"} error=${result.error} code=${result.errorCode}`
  );

  const exposeLink = shouldExposeVerificationCodeOnFailure(result.errorCode);
  return {
    ok: false,
    error: result.error,
    errorCode: result.errorCode,
    userMessage: userFacingEmailSendError(result.errorCode),
    ...(exposeLink ? { resetUrl } : {}),
  };
}
