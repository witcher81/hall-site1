import "server-only";

import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/escapeHtml";

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

  await sendEmail({
    to: input.to,
    subject: "ברוכים הבאים ל-EventForYou",
    html: `<p dir="rtl">${greetingHtml}</p><p dir="rtl">החשבון שלך נוצר בהצלחה כ<strong>${roleLabel}</strong>.</p><p dir="rtl"><a href="/">כניסה לאתר</a></p>`,
    text: `${greetingText}\nהחשבון נוצר בהצלחה (${roleLabel}).\nכניסה: /`,
  });
}
