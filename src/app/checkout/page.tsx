import { redirect } from "next/navigation";
import { requireVerifiedSession } from "@/lib/requireSession";
import { prisma } from "@/lib/prisma";
import SitePageShell from "@/components/layout/SitePageShell";
import CheckoutClient from "./CheckoutClient";
import { inquiryToCheckoutSummary } from "@/lib/checkoutDisplay";
import {
  resolveVenueThreadCatalogPricing,
} from "@/lib/catalogPricingMode";
import { parseEventTypesList } from "@/lib/venueEditFormParse";
import type { StoredServiceChoice } from "@/lib/venueInquiryAmenities";

export const runtime = "nodejs";

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

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ inquiryId?: string }>;
}) {
  const user = await requireVerifiedSession("/checkout");
  if (user.role !== "SEEKER") redirect("/");

  const { inquiryId: inquiryIdRaw } = await searchParams;
  const inquiryId = Number(inquiryIdRaw);
  if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
    redirect("/my-inquiries");
  }

  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, userId: user.id },
    select: {
      id: true,
      venueId: true,
      eventType: true,
      preferredDate: true,
      guestCount: true,
      serviceChoicesJson: true,
      venue: {
        select: {
          name: true,
          city: true,
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
          status: true,
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
    redirect("/my-inquiries");
  }

  const venueThread = inquiry.negotiationThreads[0];
  const accepted = venueThread?.offers[0];
  const acceptedExact =
    accepted != null
      ? (accepted.amountMinNis ?? accepted.amountMaxNis)
      : null;

  const venueCatalog = resolveVenueThreadCatalogPricing({
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

  const order = inquiryToCheckoutSummary(inquiry, {
    acceptedExactAmount: acceptedExact,
    fixedCatalogAmount:
      venueCatalog.pricingMode === "fixed" ? venueCatalog.exactAmount : null,
  });

  return (
    <SitePageShell mainWidth="wide">
      <CheckoutClient
        user={{ name: user.name, email: user.email }}
        order={order}
      />
    </SitePageShell>
  );
}
