import "server-only";

import { prisma } from "@/lib/prisma";
import { approvedListingWhere } from "@/lib/listingModerationTypes";
import { getCatalogPricingMode } from "@/lib/catalogPricingMode";
import type { BookingAlternativeItem } from "@/lib/bookingAlternativesTypes";

export type { BookingAlternativeItem } from "@/lib/bookingAlternativesTypes";

export async function findBookingAlternatives(input: {
  targetType: "venue" | "service";
  cancelledTargetId: number;
  paidAmountNis: number;
  inquiryId?: number;
  serviceRequestId?: number;
}): Promise<BookingAlternativeItem[]> {
  const amount = input.paidAmountNis;
  if (amount <= 0) return [];

  if (input.targetType === "venue" && input.inquiryId) {
    return findVenueAlternatives({
      cancelledVenueId: input.cancelledTargetId,
      inquiryId: input.inquiryId,
      paidAmountNis: amount,
    });
  }

  if (input.targetType === "service" && input.serviceRequestId) {
    return findServiceAlternatives({
      cancelledServiceId: input.cancelledTargetId,
      serviceRequestId: input.serviceRequestId,
      paidAmountNis: amount,
    });
  }

  return [];
}

async function findVenueAlternatives(input: {
  cancelledVenueId: number;
  inquiryId: number;
  paidAmountNis: number;
}): Promise<BookingAlternativeItem[]> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: input.inquiryId },
    select: {
      guestCount: true,
      eventType: true,
      preferredDate: true,
      venue: { select: { city: true } },
    },
  });
  if (!inquiry) return [];

  const venues = await prisma.venue.findMany({
    where: {
      id: { not: input.cancelledVenueId },
      city: inquiry.venue.city,
      ...approvedListingWhere(),
      OR: [
        { minPrice: input.paidAmountNis, maxPrice: input.paidAmountNis },
        { hallRentalMin: input.paidAmountNis, hallRentalMax: input.paidAmountNis },
      ],
    },
    take: 6,
    select: {
      id: true,
      name: true,
      city: true,
      minPrice: true,
      maxPrice: true,
      hallRentalMin: true,
      hallRentalMax: true,
    },
  });

  const matches: BookingAlternativeItem[] = [];
  for (const v of venues) {
    const min = v.hallRentalMin ?? v.minPrice;
    const max = v.hallRentalMax ?? v.maxPrice ?? min;
    const mode = getCatalogPricingMode(min, max);
    if (mode !== "fixed") continue;
    const price = min ?? max;
    if (price !== input.paidAmountNis) continue;
    matches.push({
      type: "venue",
      id: v.id,
      name: v.name,
      subtitle: v.city,
      href: `/halls/${v.id}`,
      priceNis: price,
    });
    if (matches.length >= 3) break;
  }
  return matches;
}

async function findServiceAlternatives(input: {
  cancelledServiceId: number;
  serviceRequestId: number;
  paidAmountNis: number;
}): Promise<BookingAlternativeItem[]> {
  const sr = await prisma.serviceRequest.findUnique({
    where: { id: input.serviceRequestId },
    select: {
      service: { select: { category: true, serviceArea: true } },
    },
  });
  if (!sr) return [];

  const services = await prisma.service.findMany({
    where: {
      id: { not: input.cancelledServiceId },
      category: sr.service.category ?? undefined,
      ...approvedListingWhere(),
      minPrice: input.paidAmountNis,
      maxPrice: input.paidAmountNis,
    },
    take: 6,
    select: {
      id: true,
      name: true,
      category: true,
      serviceArea: true,
      minPrice: true,
      maxPrice: true,
    },
  });

  return services.slice(0, 3).map((s) => ({
    type: "service" as const,
    id: s.id,
    name: s.name,
    subtitle: s.serviceArea ?? s.category,
    href: `/services/${s.id}`,
    priceNis: s.minPrice ?? input.paidAmountNis,
  }));
}

export async function getAlternativesForCancelledPayment(
  paymentId: number,
  seekerUserId: number
): Promise<{
  reason: string;
  alternatives: BookingAlternativeItem[];
} | null> {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId: seekerUserId, status: "REFUNDED" },
    include: { bookingCancellation: true },
  });
  if (!payment?.bookingCancellation) return null;

  let alternatives: BookingAlternativeItem[] = [];
  if (payment.bookingCancellation.alternativesJson) {
    try {
      alternatives = JSON.parse(
        payment.bookingCancellation.alternativesJson
      ) as BookingAlternativeItem[];
    } catch {
      alternatives = [];
    }
  }

  return {
    reason: payment.bookingCancellation.reason,
    alternatives,
  };
}
