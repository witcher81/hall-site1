import { NextRequest, NextResponse } from "next/server";
import { approvedListingWhere } from "@/lib/listingModerationTypes";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** סטטיסטיקות ציבוריות לעמוד אולם (דחיפות / חברתיות) */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const venueId = Number(id);
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  const venue = await prisma.venue.findFirst({
    where: { id: venueId, ...approvedListingWhere() },
    select: { id: true, city: true },
  });
  if (!venue) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [inquiriesThisWeek, bookedThisMonth] = await Promise.all([
    prisma.inquiry.count({
      where: {
        venueId,
        createdAt: { gte: weekAgo },
      },
    }),
    prisma.venueAvailability.count({
      where: {
        venueId,
        status: "BOOKED",
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
  ]);

  return NextResponse.json({
    city: venue.city,
    inquiriesThisWeek,
    eventsClosedThisMonth: bookedThisMonth,
  });
}
