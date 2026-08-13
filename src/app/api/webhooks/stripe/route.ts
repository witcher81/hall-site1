import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { nextBoostExpiry } from "@/lib/listingBoost";
import {
  SERVICE_BOOST_DAYS,
  VENUE_BOOST_DAYS,
} from "@/lib/venueBoostConfig";

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
    const purpose = session.metadata?.purpose;
    const stripePaymentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null;

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return NextResponse.json({ received: true });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        purpose: true,
        venueId: true,
        serviceId: true,
        status: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ received: true, ignored: true });
    }
    if (payment.status === "COMPLETED") {
      return NextResponse.json({ received: true });
    }
    if (payment.status !== "PENDING" || payment.purpose !== purpose) {
      return NextResponse.json({ received: true, ignored: true });
    }

    if (purpose === "venue_boost") {
      const venueId = Number(session.metadata?.venueId);
      if (
        !Number.isInteger(venueId) ||
        venueId <= 0 ||
        payment.venueId !== venueId
      ) {
        return NextResponse.json({ received: true, ignored: true });
      }
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        select: { boostExpiresAt: true },
      });
      const expires = nextBoostExpiry(venue?.boostExpiresAt, VENUE_BOOST_DAYS);
      await prisma.$transaction([
        prisma.venue.update({
          where: { id: venueId },
          data: { boostExpiresAt: expires },
        }),
        prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: "COMPLETED",
            stripePaymentId,
            completedAt: new Date(),
          },
        }),
      ]);
    }

    if (purpose === "service_boost") {
      const serviceId = Number(session.metadata?.serviceId);
      if (
        !Number.isInteger(serviceId) ||
        serviceId <= 0 ||
        payment.serviceId !== serviceId
      ) {
        return NextResponse.json({ received: true, ignored: true });
      }
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { boostExpiresAt: true },
      });
      const expires = nextBoostExpiry(service?.boostExpiresAt, SERVICE_BOOST_DAYS);
      await prisma.$transaction([
        prisma.service.update({
          where: { id: serviceId },
          data: { boostExpiresAt: expires },
        }),
        prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: "COMPLETED",
            stripePaymentId,
            completedAt: new Date(),
          },
        }),
      ]);
    }
  }

  return NextResponse.json({ received: true });
}
