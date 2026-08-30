import "server-only";

import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/escapeHtml";
import { getSiteUrl } from "@/lib/siteUrl";
import { welcomeDestinationHref } from "@/lib/welcomeDestination";

export async function sendWelcomeEmail(input: {
  to: string;
  name: string | null;
  role: string;
}): Promise<void> {
  const roleLabel =
    input.role === "VENUE_OWNER"
      ? "בעל/ת אולם"
      : input.role === "FREELANCER"
        ? "ספק/ית שירות"
        : "מחפש/ת אולמות";

  const safeName = input.name?.trim() ? escapeHtml(input.name.trim()) : "";
  const greetingHtml = safeName ? `שלום ${safeName},` : "שלום,";
  const greetingText = input.name?.trim() ? `שלום ${input.name.trim()},` : "שלום,";
  const destPath = welcomeDestinationHref(input.role);
  const destUrl = `${getSiteUrl().replace(/\/$/, "")}${destPath}`;
  const ctaLabel =
    input.role === "FREELANCER" || input.role === "VENUE_OWNER"
      ? "השלמת פרופיל העסק"
      : "חיפוש אולמות";

  await sendEmail({
    to: input.to,
    subject: "ברוכים הבאים ל-EventForYou",
    html: `<p dir="rtl">${greetingHtml}</p><p dir="rtl">החשבון שלך נוצר בהצלחה כ<strong>${roleLabel}</strong>.</p><p dir="rtl"><a href="${escapeHtml(destUrl)}">${escapeHtml(ctaLabel)}</a></p>`,
    text: `${greetingText}\nהחשבון נוצר בהצלחה (${roleLabel}).\n${ctaLabel}: ${destUrl}`,
  });
}
