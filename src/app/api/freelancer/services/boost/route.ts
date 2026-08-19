import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextBoostExpiry } from "@/lib/listingBoost";
import {
  isVenueBoostDemoPurchaseEnabled,
  SERVICE_BOOST_DAYS,
  SERVICE_BOOST_PRICE_NIS,
} from "@/lib/venueBoost.server";
import { BETA_BOOST_COPY } from "@/lib/betaPayments";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") {
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
  const serviceId = Number((body as { serviceId?: unknown }).serviceId);
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return NextResponse.json({ error: "מזהה שירות לא תקין" }, { status: 400 });
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, providerId: user.id },
    select: { id: true, boostExpiresAt: true },
  });
  if (!service) {
    return NextResponse.json({ error: "שירות לא נמצא" }, { status: 404 });
  }

  const boostExpiresAt = nextBoostExpiry(
    service.boostExpiresAt,
    SERVICE_BOOST_DAYS
  );

  await prisma.service.update({
    where: { id: serviceId },
    data: { boostExpiresAt },
  });

  return NextResponse.json({
    ok: true,
    boostExpiresAt: boostExpiresAt.toISOString(),
    priceNis: SERVICE_BOOST_PRICE_NIS,
    daysAdded: SERVICE_BOOST_DAYS,
    demoPayment: true,
  });
}
