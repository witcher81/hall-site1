import "server-only";

import { prisma } from "@/lib/prisma";
import { bookVenueDateForInquiry } from "@/lib/inquiryBookDate";
import { createNotification } from "@/lib/notifications";
import { PAYMENT_PURPOSE } from "@/lib/bookingPaymentConfig";

export async function fulfillBookingPayment(
  paymentId: number,
  stripePaymentId: string | null
): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      purpose: true,
      status: true,
      amountNis: true,
      inquiryId: true,
      serviceRequestId: true,
      userId: true,
    },
  });

  if (!payment || payment.status !== "PENDING") return;

  const now = new Date();

  if (payment.purpose === PAYMENT_PURPOSE.VENUE_BOOKING && payment.inquiryId) {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "COMPLETED",
          stripePaymentId,
          completedAt: now,
        },
      });
      await tx.inquiry.update({
        where: { id: payment.inquiryId! },
        data: {
          status: "PAID",
          paidAt: now,
          agreedAmountNis: payment.amountNis,
        },
      });
    });
    const inquiryForDate = await prisma.inquiry.findUnique({
      where: { id: payment.inquiryId },
      select: { venueId: true, preferredDate: true },
    });
    if (inquiryForDate) {
      await bookVenueDateForInquiry(
        inquiryForDate.venueId,
        inquiryForDate.preferredDate
      );
    }
    await createNotification({
      userId: payment.userId,
      type: "BOOKING_PAID",
      title: "התשלום התקבל",
      body: "ההזמנה לאולם שולמה בהצלחה. רשת הביטחון של EventForYou פעילה.",
      href: `/my-inquiries/${payment.inquiryId}`,
    });
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: payment.inquiryId },
      select: { venue: { select: { ownerId: true, name: true } } },
    });
    if (inquiry) {
      await createNotification({
        userId: inquiry.venue.ownerId,
        type: "BOOKING_PAID",
        title: "הזמנה חדשה ששולמה",
        body: `התקבלה הזמנה ששולמה לאולם «${inquiry.venue.name}».`,
        href: `/dashboard/venue-owner/inquiries/${payment.inquiryId}`,
      });
    }
    return;
  }

  if (
    payment.purpose === PAYMENT_PURPOSE.SERVICE_BOOKING &&
    payment.serviceRequestId
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "COMPLETED",
          stripePaymentId,
          completedAt: now,
        },
      });
      await tx.serviceRequest.update({
        where: { id: payment.serviceRequestId! },
        data: {
          status: "PAID",
          paidAt: now,
          agreedAmountNis: payment.amountNis,
        },
      });
    });
    await createNotification({
      userId: payment.userId,
      type: "BOOKING_PAID",
      title: "התשלום התקבל",
      body: "הבקשה לספק שולמה בהצלחה. רשת הביטחון של EventForYou פעילה.",
      href: `/my-service-requests`,
    });
    const sr = await prisma.serviceRequest.findUnique({
      where: { id: payment.serviceRequestId },
      select: {
        service: { select: { providerId: true, name: true } },
      },
    });
    if (sr) {
      await createNotification({
        userId: sr.service.providerId,
        type: "BOOKING_PAID",
        title: "בקשה חדשה ששולמה",
        body: `התקבלה בקשה ששולמה לשירות «${sr.service.name}».`,
        href: `/dashboard/freelancer/requests?requestId=${payment.serviceRequestId}`,
      });
    }
  }
}
