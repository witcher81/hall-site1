import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/siteUrl";
import {
  SERVICE_BOOST_DAYS,
  SERVICE_BOOST_PRICE_NIS,
} from "@/lib/venueBoost.server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "תשלום לא מוגדר בשרת" },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const serviceId = Number(body.serviceId);
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return NextResponse.json({ error: "מזהה שירות לא תקין" }, { status: 400 });
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, providerId: user.id },
    select: { id: true, name: true },
  });
  if (!service) {
    return NextResponse.json({ error: "שירות לא נמצא" }, { status: 404 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe לא זמין" }, { status: 503 });
  }

  const siteUrl = getSiteUrl();
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      serviceId,
      amountNis: SERVICE_BOOST_PRICE_NIS,
      purpose: "service_boost",
      status: "PENDING",
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "ils",
          unit_amount: SERVICE_BOOST_PRICE_NIS * 100,
          product_data: {
            name: `קידום שירות — ${service.name}`,
            description: `${SERVICE_BOOST_DAYS} ימים בראש החיפוש + תג מאומת`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      paymentId: String(payment.id),
      serviceId: String(serviceId),
      userId: String(user.id),
      purpose: "service_boost",
    },
    success_url: `${siteUrl}/dashboard/freelancer/services/${serviceId}?boost=success`,
    cancel_url: `${siteUrl}/dashboard/freelancer/services/${serviceId}?boost=cancel`,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({ url: session.url });
}
