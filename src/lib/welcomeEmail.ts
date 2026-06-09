import "server-only";

import { sendEmail } from "@/lib/email";

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

  const greeting = input.name?.trim() ? `שלום ${input.name.trim()},` : "שלום,";

  await sendEmail({
    to: input.to,
    subject: "ברוכים הבאים ל-Halls Hub",
    html: `<p dir="rtl">${greeting}</p><p dir="rtl">החשבון שלך נוצר בהצלחה כ<strong>${roleLabel}</strong>.</p><p dir="rtl"><a href="/">כניסה לאתר</a></p>`,
    text: `${greeting}\nהחשבון נוצר בהצלחה (${roleLabel}).\nכניסה: /`,
  });
}
