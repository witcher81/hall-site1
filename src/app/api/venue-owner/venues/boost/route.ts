import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextBoostExpiry } from "@/lib/listingBoost";
import {
  isVenueBoostDemoPurchaseEnabled,
  VENUE_BOOST_DAYS,
  VENUE_BOOST_PRICE_NIS,
} from "@/lib/venueBoost.server";
import { BETA_BOOST_COPY } from "@/lib/betaPayments";

export const runtime = "nodejs";

/**
 * קידום אולם לראש רשימת החיפוש — רק כשדמו מותר (פיתוח / VENUE_BOOST_ALLOW_DEMO).
 * בפרוד ללא סליקה אמיתית — 503 עד שיופעל תשלום.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isVenueBoostDemoPurchaseEnabled()) {
    return NextResponse.json(
      {
        error: BETA_BOOST_COPY,
        boostPurchaseEnabled: false,
      },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const venueId = Number((body as { venueId?: unknown }).venueId);
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "מזהה אולם לא תקין" }, { status: 400 });
  }

  const venue = await prisma.venue.findFirst({
    where: { id: venueId, ownerId: user.id },
    select: { id: true, boostExpiresAt: true },
  });
  if (!venue) {
    return NextResponse.json({ error: "אולם לא נמצא" }, { status: 404 });
  }

  const boostExpiresAt = nextBoostExpiry(venue.boostExpiresAt, VENUE_BOOST_DAYS);

  await prisma.venue.update({
    where: { id: venueId },
    data: { boostExpiresAt },
  });

  return NextResponse.json({
    ok: true,
    boostExpiresAt: boostExpiresAt.toISOString(),
    priceNis: VENUE_BOOST_PRICE_NIS,
    daysAdded: VENUE_BOOST_DAYS,
    demoPayment: true,
  });
}
