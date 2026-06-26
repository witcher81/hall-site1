import "server-only";

import {
  EMAIL_VERIFICATION_CODE_TTL_MS,
  createEmailVerificationCode,
} from "./emailVerification";
import { sendEmailVerificationCodeEmail } from "./emailVerificationEmail";

type SendVerificationInput = {
  userId: number;
  email: string;
  name: string | null;
};

/** יוצר קוד OTP ושולח במייל */
export async function sendEmailVerificationForUser(
  input: SendVerificationInput
): Promise<{ ok: boolean; devCode?: string; skipped?: boolean }> {
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
      `[email-verification] code sent to=${input.email} id=${result.id ?? "(none)"}`
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
    return { ok: false, devCode: rawCode, skipped: true };
  }
  console.error(
    `[email-verification] failed to=${input.email} error=${result.error}`
  );
  return { ok: false };
}
