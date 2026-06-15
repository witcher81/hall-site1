import { prisma } from "@/lib/prisma";
import { inquiryPreferredDateToUtc } from "@/lib/inquiryStatus";

/** סימון תאריך כתפוס בלוח האולם (באישור הזמנה) */
export async function bookVenueDateForInquiry(
  venueId: number,
  preferredDate: string | null | undefined
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const date = inquiryPreferredDateToUtc(preferredDate);
  if (!date) {
    return { ok: false, error: "לפנייה אין תאריך תקין לאישור.", status: 400 };
  }

  const existing = await prisma.venueAvailability.findUnique({
    where: { venueId_date: { venueId, date } },
    select: { status: true },
  });
  if (existing?.status === "BOOKED") {
    return {
      ok: false,
      error: "התאריך כבר מסומן כתפוס בלוח. שחררו את התאריך או דחו פניות אחרות לאותו יום.",
      status: 409,
    };
  }

  await prisma.venueAvailability.upsert({
    where: { venueId_date: { venueId, date } },
    create: { venueId, date, status: "BOOKED" },
    update: { status: "BOOKED" },
  });

  return { ok: true };
}
