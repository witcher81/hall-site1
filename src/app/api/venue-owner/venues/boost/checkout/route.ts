import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/siteUrl";
import {
  VENUE_BOOST_DAYS,
  VENUE_BOOST_PRICE_NIS,
} from "@/lib/venueBoost.server";
import { USER_FACING_GENERIC, USER_FACING_UNAVAILABLE } from "@/lib/userFacingErrors";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: USER_FACING_UNAVAILABLE },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const venueId = Number(body.venueId);
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "מזהה אולם לא תקין" }, { status: 400 });
  }

  const venue = await prisma.venue.findFirst({
    where: { id: venueId, ownerId: user.id },
    select: { id: true, name: true },
  });
  if (!venue) {
    return NextResponse.json({ error: "אולם לא נמצא" }, { status: 404 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: USER_FACING_UNAVAILABLE }, { status: 503 });
  }

  const siteUrl = getSiteUrl();
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      venueId,
      amountNis: VENUE_BOOST_PRICE_NIS,
      purpose: "venue_boost",
      status: "PENDING",
    },
  });

  let session;
  try {
    session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "ils",
          unit_amount: VENUE_BOOST_PRICE_NIS * 100,
          product_data: {
            name: `קידום אולם — ${venue.name}`,
            description: `${VENUE_BOOST_DAYS} ימים בראש תוצאות החיפוש + תג מאומת`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      paymentId: String(payment.id),
      venueId: String(venueId),
      userId: String(user.id),
      purpose: "venue_boost",
    },
    success_url: `${siteUrl}/dashboard/venue-owner/venues/${venueId}?boost=success`,
    cancel_url: `${siteUrl}/dashboard/venue-owner/venues/${venueId}?boost=cancel`,
    });
  } catch (error) {
    console.error("venue boost checkout:", error);
    return NextResponse.json({ error: USER_FACING_GENERIC }, { status: 500 });
  }

  if (!session.url) {
    return NextResponse.json({ error: USER_FACING_GENERIC }, { status: 500 });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({ url: session.url });
}
