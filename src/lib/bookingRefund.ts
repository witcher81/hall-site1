import "server-only";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { releaseVenueDateForInquiry } from "@/lib/inquiryBookDate";
import { createNotification } from "@/lib/notifications";
import { findBookingAlternatives } from "@/lib/bookingAlternatives";
import { PAYMENT_PURPOSE } from "@/lib/bookingPaymentConfig";

const MIN_CANCEL_REASON_LEN = 10;

export async function cancelPaidVenueBooking(input: {
  inquiryId: number;
  cancelledByUserId: number;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const reason = input.reason.trim();
  if (reason.length < MIN_CANCEL_REASON_LEN) {
    return {
      ok: false,
      error: `נא לפרט סיבת ביטול (לפחות ${MIN_CANCEL_REASON_LEN} תווים) — הלקוח יראה את הנימוק`,
      status: 400,
    };
  }

  const inquiry = await prisma.inquiry.findFirst({
    where: { id: input.inquiryId },
    select: {
      id: true,
      status: true,
      userId: true,
      venueId: true,
      preferredDate: true,
      venue: { select: { ownerId: true, name: true } },
    },
  });
  if (!inquiry) {
    return { ok: false, error: "הזמנה לא נמצאה", status: 404 };
  }
  if (inquiry.venue.ownerId !== input.cancelledByUserId) {
    return { ok: false, error: "אין הרשאה", status: 403 };
  }
  if (inquiry.status !== "PAID") {
    return { ok: false, error: "ניתן לבטל רק הזמנה ששולמה", status: 400 };
  }

  const payment = await prisma.payment.findFirst({
    where: {
      inquiryId: inquiry.id,
      purpose: PAYMENT_PURPOSE.VENUE_BOOKING,
      status: "COMPLETED",
    },
    orderBy: { completedAt: "desc" },
  });
  if (!payment) {
    return { ok: false, error: "לא נמצא תשלום להחזר", status: 400 };
  }

  const alternatives = await findBookingAlternatives({
    targetType: "venue",
    cancelledTargetId: inquiry.venueId,
    inquiryId: inquiry.id,
    paidAmountNis: payment.amountNis,
  });

  const stripe = getStripe();
  let stripeRefundId: string | null = null;
  if (stripe && payment.stripePaymentId) {
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
    });
    stripeRefundId = refund.id;
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
        stripeRefundId,
      },
    }),
    prisma.inquiry.update({
      where: { id: inquiry.id },
      data: {
        status: "CANCELLED_BY_PROVIDER",
        providerCancelReason: reason,
      },
    }),
    prisma.bookingCancellation.create({
      data: {
        paymentId: payment.id,
        cancelledByUserId: input.cancelledByUserId,
        reason,
        targetType: "venue",
        targetId: inquiry.venueId,
        alternativesJson: JSON.stringify(alternatives),
      },
    }),
  ]);

  await releaseVenueDateForInquiry(inquiry.venueId, inquiry.preferredDate);

  await createNotification({
    userId: inquiry.userId,
    type: "BOOKING_CANCELLED_REFUND",
    title: "ההזמנה בוטלה — הכסף יוחזר",
    body: `בעל האולם «${inquiry.venue.name}» ביטל את ההזמנה. סיבה: ${reason}`,
    href: `/my-inquiries/${inquiry.id}`,
  });

  return { ok: true };
}

export async function cancelPaidServiceBooking(input: {
  serviceRequestId: number;
  cancelledByUserId: number;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const reason = input.reason.trim();
  if (reason.length < MIN_CANCEL_REASON_LEN) {
    return {
      ok: false,
      error: `נא לפרט סיבת ביטול (לפחות ${MIN_CANCEL_REASON_LEN} תווים) — הלקוח יראה את הנימוק`,
      status: 400,
    };
  }

  const sr = await prisma.serviceRequest.findFirst({
    where: { id: input.serviceRequestId },
    select: {
      id: true,
      status: true,
      userId: true,
      serviceId: true,
      service: { select: { providerId: true, name: true } },
    },
  });
  if (!sr) {
    return { ok: false, error: "בקשה לא נמצאה", status: 404 };
  }
  if (sr.service.providerId !== input.cancelledByUserId) {
    return { ok: false, error: "אין הרשאה", status: 403 };
  }
  if (sr.status !== "PAID") {
    return { ok: false, error: "ניתן לבטל רק בקשה ששולמה", status: 400 };
  }

  const payment = await prisma.payment.findFirst({
    where: {
      serviceRequestId: sr.id,
      purpose: PAYMENT_PURPOSE.SERVICE_BOOKING,
      status: "COMPLETED",
    },
    orderBy: { completedAt: "desc" },
  });
  if (!payment) {
    return { ok: false, error: "לא נמצא תשלום להחזר", status: 400 };
  }

  const alternatives = await findBookingAlternatives({
    targetType: "service",
    cancelledTargetId: sr.serviceId,
    serviceRequestId: sr.id,
    paidAmountNis: payment.amountNis,
  });

  const stripe = getStripe();
  let stripeRefundId: string | null = null;
  if (stripe && payment.stripePaymentId) {
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
    });
    stripeRefundId = refund.id;
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
        stripeRefundId,
      },
    }),
    prisma.serviceRequest.update({
      where: { id: sr.id },
      data: {
        status: "CANCELLED_BY_PROVIDER",
        providerCancelReason: reason,
      },
    }),
    prisma.bookingCancellation.create({
      data: {
        paymentId: payment.id,
        cancelledByUserId: input.cancelledByUserId,
        reason,
        targetType: "service",
        targetId: sr.serviceId,
        alternativesJson: JSON.stringify(alternatives),
      },
    }),
  ]);

  await createNotification({
    userId: sr.userId,
    type: "BOOKING_CANCELLED_REFUND",
    title: "הבקשה בוטלה — הכסף יוחזר",
    body: `הספק «${sr.service.name}» ביטל את ההזמנה. סיבה: ${reason}`,
    href: `/my-service-requests`,
  });

  return { ok: true };
}
