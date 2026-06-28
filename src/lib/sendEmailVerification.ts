import "server-only";

import {
  EMAIL_VERIFICATION_CODE_TTL_MS,
  createEmailVerificationCode,
} from "./emailVerification";
import { sendEmailVerificationCodeEmail } from "./emailVerificationEmail";
import {
  shouldExposeVerificationCodeOnFailure,
  userFacingEmailSendError,
  type EmailSendErrorCode,
} from "./emailConfig";

type SendVerificationInput = {
  userId: number;
  email: string;
  name: string | null;
};

export type SendVerificationResult = {
  ok: boolean;
  devCode?: string;
  skipped?: boolean;
  error?: string;
  errorCode?: EmailSendErrorCode;
  userMessage?: string;
};

/** שדות JSON ללקוח אחרי register/login/resend */
export function verificationEmailClientPayload(
  emailSend: SendVerificationResult
): {
  emailSent: boolean;
  emailWarning?: string;
  devCode?: string;
  emailErrorCode?: EmailSendErrorCode;
} {
  if (emailSend.ok) {
    return { emailSent: true };
  }
  return {
    emailSent: false,
    emailWarning:
      emailSend.userMessage ??
      (emailSend.skipped
        ? "מייל לא נשלח (Resend לא מוגדר). בפיתוח — הקוד מופיע בדף האימות."
        : "שליחת קוד האימות נכשלה. בדף האימות לחצו «שליחת קוד חדש»."),
    devCode: emailSend.devCode,
    emailErrorCode: emailSend.errorCode,
  };
}

/** יוצר קוד OTP ושולח במייל */
export async function sendEmailVerificationForUser(
  input: SendVerificationInput
): Promise<SendVerificationResult> {
  const rawCode = await createEmailVerificationCode(input.userId);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_CODE_TTL_MS);

  const result = await sendEmailVerificationCodeEmail({
    to: input.email,
    name: input.name,
    code: rawCode,
    expiresAt,
  });

  if (result.ok) {
    console.log(
      `[email-verification] code sent to=${input.email} id=${result.id ?? "(none)"} from=${result.from}`
    );
    return { ok: true };
  }

  if (result.skipped) {
    console.warn(
      `[email-verification] skipped (RESEND_API_KEY missing). to=${input.email}`
    );
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email-verification] dev code: ${rawCode}`);
    }
    return {
      ok: false,
      devCode: rawCode,
      skipped: true,
      errorCode: result.errorCode,
      userMessage: userFacingEmailSendError(result.errorCode),
    };
  }

  console.error(
    `[email-verification] failed to=${input.email} from=${result.from ?? "?"} error=${result.error} code=${result.errorCode}`
  );

  const exposeCode = shouldExposeVerificationCodeOnFailure(result.errorCode);
  return {
    ok: false,
    error: result.error,
    errorCode: result.errorCode,
    userMessage: userFacingEmailSendError(result.errorCode),
    ...(exposeCode ? { devCode: rawCode } : {}),
  };
}
