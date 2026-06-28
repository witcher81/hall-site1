import "server-only";

import { Resend } from "resend";
import {
  RESEND_SANDBOX_FROM,
  classifyResendErrorMessage,
  getEmailFrom,
  isRecoverableFromAddressError,
  stripEnvQuotes,
  type EmailSendErrorCode,
  usesResendSandboxFrom,
} from "./emailConfig";

let cachedResend: Resend | null = null;

function getResend(): Resend | null {
  const key = stripEnvQuotes(process.env.RESEND_API_KEY ?? "");
  if (!key) return null;
  if (!cachedResend) cachedResend = new Resend(key);
  return cachedResend;
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
  | { ok: true; id: string | null; from: string }
  | {
      ok: false;
      error: string;
      errorCode: EmailSendErrorCode;
      skipped?: boolean;
      from?: string;
    };

async function sendWithFrom(
  client: Resend,
  from: string,
  input: SendEmailInput
): Promise<SendEmailResult> {
  const { data, error } = await client.emails.send({
    from,
    to: [input.to.trim()],
    subject: input.subject,
    html: input.html,
    text: input.text,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  });

  if (error) {
    const message = error.message || "Resend send failed";
    const errorCode = classifyResendErrorMessage(message);
    const code =
      (error as { statusCode?: number }).statusCode ?? "?";
    console.error(
      `[email] Resend rejected send (status=${code}) from=${from} to=${input.to} subject="${input.subject}" error=${JSON.stringify(error)}`
    );
    return { ok: false, error: message, errorCode, from };
  }

  console.log(
    `[email] Resend accepted send id=${data?.id ?? "(none)"} from=${from} to=${input.to}`
  );
  return { ok: true, id: data?.id ?? null, from };
}

/**
 * שולח מייל דרך Resend.
 * - בלי `RESEND_API_KEY` → לא שולח. בפיתוח: מדפיס לקונסולה.
 * - אם EMAIL_FROM לא מאומת — מנסה fallback ל-onboarding@resend.dev.
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
        "[email] RESEND_API_KEY missing in production — email NOT sent " +
          `(to=${input.to}, subject=${input.subject})`
      );
    }
    return {
      ok: false,
      error: "RESEND_API_KEY missing",
      errorCode: "missing_api_key",
      skipped: true,
    };
  }

  const primaryFrom = getEmailFrom();
  try {
    let result = await sendWithFrom(client, primaryFrom, input);

    if (
      !result.ok &&
      !usesResendSandboxFrom(primaryFrom) &&
      isRecoverableFromAddressError(result.errorCode)
    ) {
      console.warn(
        `[email] retrying with ${RESEND_SANDBOX_FROM} after from=${primaryFrom} failed: ${result.error}`
      );
      result = await sendWithFrom(client, RESEND_SANDBOX_FROM, input);
    }

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[email] Unexpected Resend error from=${primaryFrom} to=${input.to}: ${msg}`
    );
    return {
      ok: false,
      error: msg || "Unknown email error",
      errorCode: classifyResendErrorMessage(msg),
      from: primaryFrom,
    };
  }
}

export { getEmailFrom, RESEND_SANDBOX_FROM } from "./emailConfig";
