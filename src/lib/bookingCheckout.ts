import "server-only";

import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/siteUrl";
import {
  bookingPlatformFeeNis,
  isBookingPaymentsEnabled,
  PAYMENT_PURPOSE,
  type BookingPaymentPurpose,
} from "@/lib/bookingPaymentConfig";
import { getProviderConnectAccountId } from "@/lib/stripeConnect";
import {
  resolveInquiryCheckoutAmountNis,
  resolveServiceRequestCheckoutAmountNis,
} from "@/lib/bookingAmount";
import { USER_FACING_GENERIC, USER_FACING_UNAVAILABLE } from "@/lib/userFacingErrors";

export async function createInquiryBookingCheckout(
  inquiryId: number,
  seekerUserId: number,
  seekerEmail: string
): Promise<{ url: string } | { error: string; status: number }> {
  if (!isBookingPaymentsEnabled()) {
    return { error: USER_FACING_UNAVAILABLE, status: 503 };
  }
  const stripe = getStripe();
  if (!stripe) {
    return { error: USER_FACING_UNAVAILABLE, status: 503 };
  }

  const amountResult = await resolveInquiryCheckoutAmountNis(
    inquiryId,
    seekerUserId
  );
  if (!amountResult.ok) {
    return { error: amountResult.error, status: 400 };
  }

  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, userId: seekerUserId },
    select: {
      id: true,
      venueId: true,
      venue: {
        select: {
          name: true,
          ownerId: true,
        },
      },
    },
  });
  if (!inquiry) {
    return { error: "הזמנה לא נמצאה", status: 404 };
  }

  const connectAccountId = await getProviderConnectAccountId(
    inquiry.venue.ownerId
  );
  if (!connectAccountId) {
    return {
      error: "בעל האולם עדיין לא חיבר חשבון לקבלת תשלומים",
      status: 503,
    };
  }

  const amountNis = amountResult.amountNis;
  const platformFee = bookingPlatformFeeNis(amountNis);
  const siteUrl = getSiteUrl();

  const payment = await prisma.payment.create({
    data: {
      userId: seekerUserId,
      inquiryId,
      venueId: inquiry.venueId,
      providerUserId: inquiry.venue.ownerId,
      amountNis,
      platformFeeNis: platformFee,
      purpose: PAYMENT_PURPOSE.VENUE_BOOKING,
      status: "PENDING",
    },
  });

  const session = await createConnectCheckoutSession(stripe, {
    amountNis,
    platformFeeNis: platformFee,
    connectAccountId,
    customerEmail: seekerEmail,
    productName: `הזמנת אולם — ${inquiry.venue.name}`,
    productDescription: "תשלום מאובטח דרך EventForYou — רשת ביטחון פעילה",
    successUrl: `${siteUrl}/checkout/success?inquiryId=${inquiryId}`,
    cancelUrl: `${siteUrl}/checkout?inquiryId=${inquiryId}`,
    metadata: {
      paymentId: String(payment.id),
      purpose: PAYMENT_PURPOSE.VENUE_BOOKING,
      inquiryId: String(inquiryId),
      userId: String(seekerUserId),
    },
  });

  if (!session.url) {
    return { error: USER_FACING_GENERIC, status: 500 };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeSessionId: session.id },
  });

  return { url: session.url };
}

export async function createServiceRequestBookingCheckout(
  serviceRequestId: number,
  seekerUserId: number,
  seekerEmail: string
): Promise<{ url: string } | { error: string; status: number }> {
  if (!isBookingPaymentsEnabled()) {
    return { error: USER_FACING_UNAVAILABLE, status: 503 };
  }
  const stripe = getStripe();
  if (!stripe) {
    return { error: USER_FACING_UNAVAILABLE, status: 503 };
  }

  const amountResult = await resolveServiceRequestCheckoutAmountNis(
    serviceRequestId,
    seekerUserId
  );
  if (!amountResult.ok) {
    return { error: amountResult.error, status: 400 };
  }

  const sr = await prisma.serviceRequest.findFirst({
    where: { id: serviceRequestId, userId: seekerUserId },
    select: {
      id: true,
      serviceId: true,
      service: {
        select: { name: true, providerId: true },
      },
    },
  });
  if (!sr) {
    return { error: "בקשה לא נמצאה", status: 404 };
  }

  const connectAccountId = await getProviderConnectAccountId(
    sr.service.providerId
  );
  if (!connectAccountId) {
    return {
      error: "הספק עדיין לא חיבר חשבון לקבלת תשלומים",
      status: 503,
    };
  }

  const amountNis = amountResult.amountNis;
  const platformFee = bookingPlatformFeeNis(amountNis);
  const siteUrl = getSiteUrl();

  const payment = await prisma.payment.create({
    data: {
      userId: seekerUserId,
      serviceRequestId,
      serviceId: sr.serviceId,
      providerUserId: sr.service.providerId,
      amountNis,
      platformFeeNis: platformFee,
      purpose: PAYMENT_PURPOSE.SERVICE_BOOKING,
      status: "PENDING",
    },
  });

  const session = await createConnectCheckoutSession(stripe, {
    amountNis,
    platformFeeNis: platformFee,
    connectAccountId,
    customerEmail: seekerEmail,
    productName: `שירות — ${sr.service.name}`,
    productDescription: "תשלום מאובטח דרך EventForYou — רשת ביטחון פעילה",
    successUrl: `${siteUrl}/checkout/success?serviceRequestId=${serviceRequestId}`,
    cancelUrl: `${siteUrl}/checkout?serviceRequestId=${serviceRequestId}`,
    metadata: {
      paymentId: String(payment.id),
      purpose: PAYMENT_PURPOSE.SERVICE_BOOKING,
      serviceRequestId: String(serviceRequestId),
      userId: String(seekerUserId),
    },
  });

  if (!session.url) {
    return { error: USER_FACING_GENERIC, status: 500 };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeSessionId: session.id },
  });

  return { url: session.url };
}

async function createConnectCheckoutSession(
  stripe: Stripe,
  input: {
    amountNis: number;
    platformFeeNis: number;
    connectAccountId: string;
    customerEmail: string;
    productName: string;
    productDescription: string;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
  }
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "ils",
          unit_amount: input.amountNis * 100,
          product_data: {
            name: input.productName,
            description: input.productDescription,
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: input.platformFeeNis * 100,
      transfer_data: {
        destination: input.connectAccountId,
      },
    },
    metadata: input.metadata,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });
}
