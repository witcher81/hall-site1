import "server-only";

import {
  EMAIL_VERIFICATION_TOKEN_TTL_MS,
  createEmailVerificationToken,
} from "./emailVerification";
import { sendEmailVerificationEmail } from "./emailVerificationEmail";
import { getSiteUrl } from "./siteUrl";

type SendVerificationInput = {
  userId: number;
  email: string;
  name: string | null;
};

/** יוצר טוקן ושולח מייל אימות — מחזיר את ה-URL (לדיבאג מקומי) */
export async function sendEmailVerificationForUser(
  input: SendVerificationInput
): Promise<{ ok: boolean; verifyUrl: string; skipped?: boolean }> {
  const rawToken = await createEmailVerificationToken(input.userId);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS);
  const verifyUrl = `${getSiteUrl()}/auth/verify-email?token=${rawToken}`;

  const result = await sendEmailVerificationEmail({
    to: input.email,
    name: input.name,
    verifyUrl,
    expiresAt,
  });

  if (result.ok) {
    console.log(
      `[email-verification] sent to=${input.email} id=${result.id ?? "(none)"}`
    );
    return { ok: true, verifyUrl };
  }
  if (result.skipped) {
    console.warn(
      `[email-verification] skipped (RESEND_API_KEY missing). to=${input.email}`
    );
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email-verification] dev link: ${verifyUrl}`);
    }
    return { ok: false, verifyUrl, skipped: true };
  }
  console.error(
    `[email-verification] failed to=${input.email} error=${result.error}`
  );
  return { ok: false, verifyUrl };
}
