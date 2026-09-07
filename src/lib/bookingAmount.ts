import "server-only";

import { prisma } from "@/lib/prisma";
import {
  getCatalogPricingMode,
  resolveVenueThreadCatalogPricing,
} from "@/lib/catalogPricingMode";
import { parseEventTypesList } from "@/lib/venueEditFormParse";
import type { StoredServiceChoice } from "@/lib/venueInquiryAmenities";

function parseServiceChoicesJson(raw: string | null): StoredServiceChoice[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is StoredServiceChoice =>
        typeof item === "object" && item != null && "id" in item && "label" in item
    );
  } catch {
    return [];
  }
}

export type ResolvedCheckoutAmount =
  | { ok: true; amountNis: number; source: "accepted_offer" | "fixed_catalog" }
  | { ok: false; error: string };

export async function resolveInquiryCheckoutAmountNis(
  inquiryId: number,
  seekerUserId: number
): Promise<ResolvedCheckoutAmount> {
  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, userId: seekerUserId },
    select: {
      id: true,
      status: true,
      agreedAmountNis: true,
      guestCount: true,
      eventType: true,
      serviceChoicesJson: true,
      venue: {
        select: {
          minPrice: true,
          maxPrice: true,
          hallRentalMin: true,
          hallRentalMax: true,
          eventTypes: true,
          eventTypeProfilesJson: true,
        },
      },
      negotiationThreads: {
        where: { kind: "VENUE" },
        select: {
          offers: {
            where: { status: "ACCEPTED" },
            select: { amountMinNis: true, amountMaxNis: true },
            take: 1,
          },
        },
        take: 1,
      },
    },
  });

  if (!inquiry) {
    return { ok: false, error: "הזמנה לא נמצאה" };
  }
  if (inquiry.status === "PAID") {
    return { ok: false, error: "ההזמנה כבר שולמה" };
  }
  if (inquiry.status === "CANCELLED_BY_PROVIDER" || inquiry.status === "CANCELLED") {
    return { ok: false, error: "ההזמנה בוטלה" };
  }

  if (inquiry.agreedAmountNis != null && inquiry.agreedAmountNis > 0) {
    return {
      ok: true,
      amountNis: inquiry.agreedAmountNis,
      source: "accepted_offer",
    };
  }

  const accepted = inquiry.negotiationThreads[0]?.offers[0];
  if (accepted) {
    const amount = accepted.amountMinNis ?? accepted.amountMaxNis;
    if (amount != null && amount > 0) {
      return { ok: true, amountNis: amount, source: "accepted_offer" };
    }
  }

  const catalog = resolveVenueThreadCatalogPricing({
    hallRentalMin: inquiry.venue.hallRentalMin,
    hallRentalMax: inquiry.venue.hallRentalMax,
    venueMinPrice: inquiry.venue.minPrice,
    venueMaxPrice: inquiry.venue.maxPrice,
    guestCount: inquiry.guestCount,
    eventType: inquiry.eventType,
    eventTypeProfilesJson: inquiry.venue.eventTypeProfilesJson,
    eventTypes: parseEventTypesList(inquiry.venue.eventTypes),
    serviceChoices: parseServiceChoicesJson(inquiry.serviceChoicesJson),
  });

  if (catalog.pricingMode === "fixed" && catalog.exactAmount != null) {
    return {
      ok: true,
      amountNis: catalog.exactAmount,
      source: "fixed_catalog",
    };
  }

  return {
    ok: false,
    error: "לא ניתן לשלם עדיין — נדרש מחיר מוסכם או מחיר קבוע בקטלוג",
  };
}

export async function resolveServiceRequestCheckoutAmountNis(
  serviceRequestId: number,
  seekerUserId: number
): Promise<ResolvedCheckoutAmount> {
  const sr = await prisma.serviceRequest.findFirst({
    where: { id: serviceRequestId, userId: seekerUserId },
    select: {
      id: true,
      status: true,
      agreedAmountNis: true,
      service: {
        select: { minPrice: true, maxPrice: true, name: true },
      },
      negotiationThread: {
        select: {
          offers: {
            where: { status: "ACCEPTED" },
            select: { amountMinNis: true, amountMaxNis: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!sr) {
    return { ok: false, error: "בקשה לא נמצאה" };
  }
  if (sr.status === "PAID") {
    return { ok: false, error: "הבקשה כבר שולמה" };
  }
  if (sr.status === "CANCELLED_BY_PROVIDER" || sr.status === "CANCELLED") {
    return { ok: false, error: "הבקשה בוטלה" };
  }

  if (sr.agreedAmountNis != null && sr.agreedAmountNis > 0) {
    return {
      ok: true,
      amountNis: sr.agreedAmountNis,
      source: "accepted_offer",
    };
  }

  const accepted = sr.negotiationThread?.offers[0];
  if (accepted) {
    const amount = accepted.amountMinNis ?? accepted.amountMaxNis;
    if (amount != null && amount > 0) {
      return { ok: true, amountNis: amount, source: "accepted_offer" };
    }
  }

  const mode = getCatalogPricingMode(
    sr.service.minPrice,
    sr.service.maxPrice
  );
  if (mode === "fixed") {
    const amount = sr.service.minPrice ?? sr.service.maxPrice;
    if (amount != null && amount > 0) {
      return { ok: true, amountNis: amount, source: "fixed_catalog" };
    }
  }

  return {
    ok: false,
    error: "לא ניתן לשלם עדיין — נדרש מחיר מוסכם או מחיר קבוע בשירות",
  };
}
