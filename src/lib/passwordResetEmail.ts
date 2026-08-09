import "server-only";

import { escapeHtml } from "./escapeHtml";
import { sendEmail, type SendEmailResult } from "./email";

type SendPasswordResetEmailInput = {
  to: string;
  name: string | null;
  resetUrl: string;
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

export async function sendPasswordResetEmail(
  input: SendPasswordResetEmailInput
): Promise<SendEmailResult> {
  const hrefUrl = escapeHtml(input.resetUrl);
  const greetingName = (input.name ?? "").trim();
  const greeting = greetingName ? `שלום ${escapeHtml(greetingName)},` : "שלום,";
  const validUntil = escapeHtml(formatHebrewDateTime(input.expiresAt));

  const subject = "איפוס סיסמה ל-EventForYou";

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
                <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;letter-spacing:0.25em;color:#C9A227;">EVENT FOR YOU</p>
                <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:600;color:#0F3B2E;">איפוס סיסמה</h1>
                <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;">${greeting}</p>
                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;">קיבלנו בקשה לאיפוס הסיסמה לחשבון שלכם ב-EventForYou. לחצו על הכפתור כדי לבחור סיסמה חדשה.</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:8px auto 24px auto;">
                  <tr>
                    <td align="center" bgcolor="#C9A227" style="border-radius:9999px;mso-padding-alt:14px 36px;">
                      <a href="${hrefUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:9999px;background:#C9A227;">בחירת סיסמה חדשה</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px 0;font-size:12px;line-height:1.6;color:#5F5F5F;">הקישור תקף עד <strong>${validUntil}</strong> וניתן לשימוש פעם אחת בלבד.</p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#9A948C;">אם לא ביקשתם איפוס סיסמה, אפשר להתעלם מהמייל. הסיסמה הקיימת תישאר ללא שינוי.</p>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0 0;font-size:11px;color:#6B6560;">EventForYou · אין להשיב למייל אוטומטי זה</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "EventForYou - איפוס סיסמה",
    "",
    greetingName ? `שלום ${greetingName},` : "שלום,",
    "",
    "קיבלנו בקשה לאיפוס הסיסמה לחשבון שלכם.",
    "כדי לבחור סיסמה חדשה, פתחו את הקישור הבא:",
    input.resetUrl,
    "",
    `הקישור תקף עד ${formatHebrewDateTime(input.expiresAt)} וניתן לשימוש פעם אחת בלבד.`,
    "",
    "אם לא ביקשתם איפוס סיסמה, אפשר להתעלם מהמייל.",
  ].join("\n");

  return sendEmail({ to: input.to, subject, html, text });
}
