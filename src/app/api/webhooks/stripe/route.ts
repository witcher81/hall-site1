import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { VENUE_BOOST_DAYS } from "@/lib/venueBoost";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const paymentId = Number(session.metadata?.paymentId);
    const venueId = Number(session.metadata?.venueId);
    const purpose = session.metadata?.purpose;

    if (
      purpose === "venue_boost" &&
      Number.isInteger(paymentId) &&
      paymentId > 0 &&
      Number.isInteger(venueId) &&
      venueId > 0
    ) {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        select: { boostExpiresAt: true },
      });
      const base =
        venue?.boostExpiresAt && venue.boostExpiresAt > new Date()
          ? venue.boostExpiresAt
          : new Date();
      const expires = new Date(base);
      expires.setDate(expires.getDate() + VENUE_BOOST_DAYS);

      await prisma.$transaction([
        prisma.venue.update({
          where: { id: venueId },
          data: { boostExpiresAt: expires },
        }),
        prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: "COMPLETED",
            stripePaymentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            completedAt: new Date(),
          },
        }),
      ]);
    }
  }

  return NextResponse.json({ received: true });
}
