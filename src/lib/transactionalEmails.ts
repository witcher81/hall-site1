import "server-only";

import { escapeHtml } from "./escapeHtml";
import { sendEmail } from "./email";
import { getSiteUrl } from "./siteUrl";

function emailShell(title: string, bodyHtml: string): string {
  const safeTitle = escapeHtml(title);
  return `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#e5ddd0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;direction:rtl;text-align:right;color:#171717;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#e5ddd0;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #d9cfc0;border-radius:16px;padding:28px;box-shadow:0 8px 28px rgba(0,0,0,0.08);">
            <tr>
              <td>
                <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;letter-spacing:0.25em;color:#d97706;">HALLS HUB</p>
                <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#022c22;">${safeTitle}</h1>
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  const url = escapeHtml(href);
  const text = escapeHtml(label);
  return `<p style="margin:24px 0 0 0;">
    <a href="${url}" style="display:inline-block;background:#fbbf24;color:#0a0a0a;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:9999px;">${text}</a>
  </p>`;
}

function fireAndForget(p: Promise<unknown>, label: string): void {
  void p.catch((err) => {
    console.error(`[email] ${label} failed:`, err);
  });
}

export function notifyVenueOwnerNewInquiry(input: {
  ownerEmail: string;
  ownerName: string | null;
  venueName: string;
  inquiryId: number;
  seekerName: string | null;
  preferredDate: string | null;
  eventType: string | null;
}): void {
  const site = getSiteUrl();
  const href = `${site}/dashboard/venue-owner/inquiries/${input.inquiryId}`;
  const greeting = input.ownerName?.trim()
    ? `שלום ${escapeHtml(input.ownerName.trim())},`
    : "שלום,";
  const details: string[] = [];
  if (input.eventType) details.push(`סוג אירוע: ${escapeHtml(input.eventType)}`);
  if (input.preferredDate) details.push(`תאריך: ${escapeHtml(input.preferredDate)}`);
  if (input.seekerName) details.push(`מאת: ${escapeHtml(input.seekerName)}`);

  const body = `<p style="margin:0 0 12px 0;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 12px 0;line-height:1.6;">התקבלה <strong>פנייה חדשה</strong> לאולם <strong>${escapeHtml(input.venueName)}</strong>.</p>
    ${details.length ? `<ul style="margin:0 0 12px 0;padding-right:20px;line-height:1.6;">${details.map((d) => `<li>${d}</li>`).join("")}</ul>` : ""}
    ${ctaButton(href, "לצפייה בפנייה")}`;

  fireAndForget(
    sendEmail({
      to: input.ownerEmail,
      subject: `פנייה חדשה — ${input.venueName}`,
      html: emailShell("פנייה חדשה לאולם", body),
      text: `פנייה חדשה לאולם ${input.venueName}. ${href}`,
    }),
    "venueOwnerNewInquiry"
  );
}

export function notifySeekerInquiryReplied(input: {
  seekerEmail: string;
  seekerName: string | null;
  venueName: string;
  autoReply?: boolean;
  inquiryId?: number;
}): void {
  const site = getSiteUrl();
  const href = input.inquiryId
    ? `${site}/my-inquiries/${input.inquiryId}`
    : `${site}/my-inquiries`;
  const greeting = input.seekerName?.trim()
    ? `שלום ${escapeHtml(input.seekerName.trim())},`
    : "שלום,";
  const kind = input.autoReply ? "תשובה אוטומטית" : "תשובה";

  const body = `<p style="margin:0 0 12px 0;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 12px 0;line-height:1.6;">התקבלה ${kind} מבעל האולם <strong>${escapeHtml(input.venueName)}</strong> לפנייה ששלחת.</p>
    ${ctaButton(href, "לצפייה בפנייה")}`;

  fireAndForget(
    sendEmail({
      to: input.seekerEmail,
      subject: `תשובה לפנייה — ${input.venueName}`,
      html: emailShell("פנייה נענתה", body),
      text: `תשובה לפנייה עבור ${input.venueName}. ${href}`,
    }),
    "seekerInquiryReplied"
  );
}

export function notifySeekerInquiryViewed(input: {
  seekerEmail: string;
  seekerName: string | null;
  venueName: string;
  inquiryId: number;
}): void {
  const site = getSiteUrl();
  const href = `${site}/my-inquiries/${input.inquiryId}`;
  const greeting = input.seekerName?.trim()
    ? `שלום ${escapeHtml(input.seekerName.trim())},`
    : "שלום,";

  const body = `<p style="margin:0 0 12px 0;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 12px 0;line-height:1.6;">בעל האולם <strong>${escapeHtml(input.venueName)}</strong> ראה את בקשת ההזמנה שלך ויענה בהקדם האפשרי.</p>
    ${ctaButton(href, "למעקב ההזמנה")}`;

  fireAndForget(
    sendEmail({
      to: input.seekerEmail,
      subject: `הבקשה נצפתה — ${input.venueName}`,
      html: emailShell("בעל האולם ראה את הבקשה", body),
      text: `בעל האולם ראה את הבקשה עבור ${input.venueName}. ${href}`,
    }),
    "seekerInquiryViewed"
  );
}

export function notifySeekerInquiryApproved(input: {
  seekerEmail: string;
  seekerName: string | null;
  venueName: string;
  inquiryId: number;
}): void {
  const site = getSiteUrl();
  const href = `${site}/my-inquiries/${input.inquiryId}`;
  const greeting = input.seekerName?.trim()
    ? `שלום ${escapeHtml(input.seekerName.trim())},`
    : "שלום,";

  const body = `<p style="margin:0 0 12px 0;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 12px 0;line-height:1.6;">בשורות טובות — בעל האולם <strong>${escapeHtml(input.venueName)}</strong> <strong>אישר את בקשת ההזמנה</strong> שלך.</p>
    <p style="margin:0 0 12px 0;line-height:1.6;color:#525252;">התאריך שמור אצל האולם. לפרטים נוספים או תיאום — צרו קשר ישירות עם האולם.</p>
    ${ctaButton(href, "לצפייה בהזמנה")}`;

  fireAndForget(
    sendEmail({
      to: input.seekerEmail,
      subject: `ההזמנה אושרה — ${input.venueName}`,
      html: emailShell("ההזמנה אושרה", body),
      text: `ההזמנה אושרה עבור ${input.venueName}. ${href}`,
    }),
    "seekerInquiryApproved"
  );
}

export function notifySeekerInquiryRejected(input: {
  seekerEmail: string;
  seekerName: string | null;
  venueName: string;
  inquiryId: number;
}): void {
  const site = getSiteUrl();
  const href = `${site}/my-inquiries/${input.inquiryId}`;
  const greeting = input.seekerName?.trim()
    ? `שלום ${escapeHtml(input.seekerName.trim())},`
    : "שלום,";

  const body = `<p style="margin:0 0 12px 0;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 12px 0;line-height:1.6;">בעל האולם <strong>${escapeHtml(input.venueName)}</strong> דחה את בקשת ההזמנה שלך.</p>
    <p style="margin:0 0 12px 0;line-height:1.6;color:#525252;">אפשר לחפש אולמות נוספים או לשלוח פנייה לתאריך אחר.</p>
    ${ctaButton(href, "לצפייה בפרטים")}`;

  fireAndForget(
    sendEmail({
      to: input.seekerEmail,
      subject: `ההזמנה נדחתה — ${input.venueName}`,
      html: emailShell("ההזמנה נדחתה", body),
      text: `ההזמנה נדחתה עבור ${input.venueName}. ${href}`,
    }),
    "seekerInquiryRejected"
  );
}

export function notifyFreelancerNewServiceRequest(input: {
  providerEmail: string;
  providerName: string | null;
  serviceName: string;
  seekerName: string | null;
}): void {
  const site = getSiteUrl();
  const href = `${site}/dashboard/freelancer/requests`;
  const greeting = input.providerName?.trim()
    ? `שלום ${escapeHtml(input.providerName.trim())},`
    : "שלום,";

  const body = `<p style="margin:0 0 12px 0;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 12px 0;line-height:1.6;">התקבלה <strong>בקשה חדשה</strong> לשירות <strong>${escapeHtml(input.serviceName)}</strong>${input.seekerName ? ` מ־${escapeHtml(input.seekerName)}` : ""}.</p>
    ${ctaButton(href, "לצפייה בבקשות")}`;

  fireAndForget(
    sendEmail({
      to: input.providerEmail,
      subject: `בקשה חדשה — ${input.serviceName}`,
      html: emailShell("בקשה חדשה לספק", body),
      text: `בקשה חדשה לשירות ${input.serviceName}. ${href}`,
    }),
    "freelancerNewServiceRequest"
  );
}

export function notifySeekerServiceRequestReplied(input: {
  seekerEmail: string;
  seekerName: string | null;
  serviceName: string;
}): void {
  const site = getSiteUrl();
  const href = `${site}/my-service-requests`;
  const greeting = input.seekerName?.trim()
    ? `שלום ${escapeHtml(input.seekerName.trim())},`
    : "שלום,";

  const body = `<p style="margin:0 0 12px 0;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 12px 0;line-height:1.6;">הספק ענה לבקשה שלך עבור <strong>${escapeHtml(input.serviceName)}</strong>.</p>
    ${ctaButton(href, "לצפייה בבקשות שלי")}`;

  fireAndForget(
    sendEmail({
      to: input.seekerEmail,
      subject: `תשובה מהספק — ${input.serviceName}`,
      html: emailShell("בקשה נענתה", body),
      text: `תשובה לבקשה עבור ${input.serviceName}. ${href}`,
    }),
    "seekerServiceRequestReplied"
  );
}

export function notifyNegotiationOfferReceived(input: {
  recipientEmail: string;
  recipientName: string | null;
  venueName: string;
  href: string;
}): void {
  const site = getSiteUrl();
  const url = input.href.startsWith("http") ? input.href : `${site}${input.href}`;
  const greeting = input.recipientName?.trim()
    ? `שלום ${escapeHtml(input.recipientName.trim())},`
    : "שלום,";

  const body = `<p style="margin:0 0 12px 0;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 12px 0;line-height:1.6;">התקבלה <strong>הצעת מחיר חדשה</strong> בהתמקחות עבור <strong>${escapeHtml(input.venueName)}</strong>.</p>
    ${ctaButton(url, "לצפייה בהתמקחות")}`;

  fireAndForget(
    sendEmail({
      to: input.recipientEmail,
      subject: `הצעת מחיר חדשה — ${input.venueName}`,
      html: emailShell("הצעת מחיר בהתמקחות", body),
      text: `הצעת מחיר חדשה עבור ${input.venueName}. ${url}`,
    }),
    "negotiationOfferReceived"
  );
}

export function notifyNegotiationOfferAccepted(input: {
  recipientEmail: string;
  recipientName: string | null;
  venueName: string;
  href: string;
}): void {
  const site = getSiteUrl();
  const url = input.href.startsWith("http") ? input.href : `${site}${input.href}`;
  const greeting = input.recipientName?.trim()
    ? `שלום ${escapeHtml(input.recipientName.trim())},`
    : "שלום,";

  const body = `<p style="margin:0 0 12px 0;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 12px 0;line-height:1.6;">הצעת המחיר בהתמקחות עבור <strong>${escapeHtml(input.venueName)}</strong> <strong>אושרה</strong>.</p>
    ${ctaButton(url, "לצפייה בהתמקחות")}`;

  fireAndForget(
    sendEmail({
      to: input.recipientEmail,
      subject: `הצעה התקבלה — ${input.venueName}`,
      html: emailShell("הצעת מחיר התקבלה", body),
      text: `הצעת מחיר התקבלה עבור ${input.venueName}. ${url}`,
    }),
    "negotiationOfferAccepted"
  );
}
