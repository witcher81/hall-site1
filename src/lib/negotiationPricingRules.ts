import "server-only";

import { prisma } from "@/lib/prisma";
import {
  assertCanCreateExactQuote,
  resolveServiceCatalogPricing,
  resolveVenueThreadCatalogPricing,
  type CatalogBounds,
} from "@/lib/catalogPricingMode";
import { threadKindFromDb } from "@/lib/negotiationThreads";
import type { StoredServiceChoice } from "@/lib/venueInquiryAmenities";
import { parseEventTypesList } from "@/lib/venueEditFormParse";
import { createNotification } from "@/lib/notifications";

export { assertCanCreateExactQuote };

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

export async function loadThreadCatalogBounds(
  threadId: number
): Promise<
  | {
      ok: true;
      thread: {
        id: number;
        inquiryId: number;
        kind: string;
        status: string;
        seekerReQuoteRequestedAt: Date | null;
        serviceId: number | null;
      };
      catalog: CatalogBounds;
      offers: Array<{ id: number; authorRole: string; status: string }>;
      providerUserId: number | null;
      seekerUserId: number;
    }
  | { ok: false; error: string }
> {
  const thread = await prisma.negotiationThread.findUnique({
    where: { id: threadId },
    include: {
      inquiry: {
        select: {
          userId: true,
          guestCount: true,
          eventType: true,
          serviceChoicesJson: true,
          venue: {
            select: {
              ownerId: true,
              minPrice: true,
              maxPrice: true,
              hallRentalMin: true,
              hallRentalMax: true,
              eventTypes: true,
              eventTypeProfilesJson: true,
            },
          },
        },
      },
      service: {
        select: { minPrice: true, maxPrice: true, providerId: true },
      },
      offers: {
        select: { id: true, authorRole: true, status: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!thread) return { ok: false, error: "שרשור לא נמצא" };

  const kind = threadKindFromDb(thread.kind);
  let catalog: CatalogBounds;
  if (kind === "VENUE") {
    catalog = resolveVenueThreadCatalogPricing({
      hallRentalMin: thread.inquiry.venue.hallRentalMin,
      hallRentalMax: thread.inquiry.venue.hallRentalMax,
      venueMinPrice: thread.inquiry.venue.minPrice,
      venueMaxPrice: thread.inquiry.venue.maxPrice,
      guestCount: thread.inquiry.guestCount,
      eventType: thread.inquiry.eventType,
      eventTypeProfilesJson: thread.inquiry.venue.eventTypeProfilesJson,
      eventTypes: parseEventTypesList(thread.inquiry.venue.eventTypes),
      serviceChoices: parseServiceChoicesJson(thread.inquiry.serviceChoicesJson),
    });
  } else {
    catalog = resolveServiceCatalogPricing(
      thread.service?.minPrice ?? null,
      thread.service?.maxPrice ?? null
    );
  }

  return {
    ok: true,
    thread: {
      id: thread.id,
      inquiryId: thread.inquiryId,
      kind: thread.kind,
      status: thread.status,
      seekerReQuoteRequestedAt: thread.seekerReQuoteRequestedAt,
      serviceId: thread.serviceId,
    },
    catalog,
    offers: thread.offers,
    providerUserId:
      kind === "VENUE"
        ? thread.inquiry.venue.ownerId
        : (thread.service?.providerId ?? null),
    seekerUserId: thread.inquiry.userId,
  };
}

export async function requestSeekerReQuote(input: {
  threadId: number;
  actorUserId: number;
}): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  const loaded = await loadThreadCatalogBounds(input.threadId);
  if (!loaded.ok) return { ok: false, error: loaded.error, status: 404 };

  if (loaded.seekerUserId !== input.actorUserId) {
    return { ok: false, error: "רק המבקש יכול לבקש ציטוט מחדש", status: 403 };
  }
  if (loaded.thread.status !== "OPEN") {
    return { ok: false, error: "השרשור סגור", status: 400 };
  }
  if (loaded.catalog.pricingMode === "fixed") {
    return { ok: false, error: "בקשת ציטוט מחדש אינה זמינה למחיר קבוע", status: 400 };
  }
  if (loaded.thread.seekerReQuoteRequestedAt) {
    return { ok: false, error: "כבר נוצלה בקשת ציטוט מחדש", status: 400 };
  }

  const pending = await prisma.negotiationOffer.findFirst({
    where: {
      threadId: input.threadId,
      status: "PENDING",
      authorRole: { in: ["VENUE_OWNER", "FREELANCER"] },
    },
  });
  const rejected = await prisma.negotiationOffer.findFirst({
    where: {
      threadId: input.threadId,
      status: "REJECTED",
      authorRole: { in: ["VENUE_OWNER", "FREELANCER"] },
    },
  });
  if (!pending && !rejected) {
    return { ok: false, error: "אין ציטוט לבקשת חידוש", status: 400 };
  }

  await prisma.$transaction(async (tx) => {
    if (pending) {
      await tx.negotiationOffer.updateMany({
        where: {
          threadId: input.threadId,
          status: "PENDING",
        },
        data: { status: "SUPERSEDED" },
      });
    }
    await tx.negotiationThread.update({
      where: { id: input.threadId },
      data: { seekerReQuoteRequestedAt: new Date() },
    });
  });

  if (loaded.providerUserId) {
    await createNotification({
      userId: loaded.providerUserId,
      type: "NEGOTIATION_UPDATE",
      title: "בקשת ציטוט מחיר מחדש",
      body: "המבקש מבקש מחיר מדויק מעודכן.",
      href:
        loaded.thread.kind === "VENUE"
          ? `/dashboard/venue-owner/inquiries/${loaded.thread.inquiryId}`
          : `/dashboard/freelancer/requests?inquiryId=${loaded.thread.inquiryId}&threadId=${loaded.thread.id}`,
    });
  }

  return { ok: true };
}
