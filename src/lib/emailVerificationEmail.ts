import "server-only";

import { escapeHtml } from "./escapeHtml";
import { sendEmail, type SendEmailResult } from "./email";

type SendEmailVerificationCodeInput = {
  to: string;
  name: string | null;
  code: string;
  expiresAt: Date;
};

function formatHebrewDateTime(d: Date): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Asia/Jerusalem",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

export async function sendEmailVerificationCodeEmail(
  input: SendEmailVerificationCodeInput
): Promise<SendEmailResult> {
  const greetingName = (input.name ?? "").trim();
  const greeting = greetingName ? `שלום ${escapeHtml(greetingName)},` : "שלום,";
  const validUntil = escapeHtml(formatHebrewDateTime(input.expiresAt));
  const codeHtml = escapeHtml(input.code);

  const subject = "קוד אימות — Halls Hub";

  const html = `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#EFE6D5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;direction:rtl;text-align:right;color:#1A1A1A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#EFE6D5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #E0D4C3;border-radius:16px;padding:28px;box-shadow:0 12px 40px rgba(15,59,46,0.08);">
            <tr>
              <td>
                <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;letter-spacing:0.25em;color:#C9A227;">HALLS HUB</p>
                <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:600;color:#0F3B2E;">אימות כתובת אימייל</h1>
                <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;">${greeting}</p>
                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;">הזינו את הקוד הבא באתר כדי להשלים את ההרשמה ולהתחבר:</p>
                <p style="margin:0 0 24px 0;text-align:center;font-size:32px;font-weight:700;letter-spacing:0.35em;color:#0F3B2E;font-family:ui-monospace,monospace;">${codeHtml}</p>
                <p style="margin:0 0 8px 0;font-size:12px;line-height:1.6;color:#5F5F5F;">הקוד תקף עד <strong>${validUntil}</strong> (15 דקות).</p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#9A948C;">אם לא נרשמתם לאתר, אפשר להתעלם מהמייל.</p>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0 0;font-size:11px;color:#6B6560;">Halls Hub · אין להשיב למייל אוטומטי זה</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "Halls Hub - קוד אימות אימייל",
    "",
    greetingName ? `שלום ${greetingName},` : "שלום,",
    "",
    `קוד האימות שלכם: ${input.code}`,
    "",
    `הקוד תקף עד ${formatHebrewDateTime(input.expiresAt)} (15 דקות).`,
    "",
    "אם לא נרשמתם לאתר, אפשר להתעלם מהמייל.",
  ].join("\n");

  return sendEmail({ to: input.to, subject, html, text });
}
