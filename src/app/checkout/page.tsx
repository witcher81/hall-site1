import { redirect } from "next/navigation";
import { requireVerifiedSession } from "@/lib/requireSession";
import { prisma } from "@/lib/prisma";
import SitePageShell from "@/components/layout/SitePageShell";
import CheckoutClient from "./CheckoutClient";
import {
  inquiryToCheckoutSummary,
  serviceRequestToCheckoutSummary,
} from "@/lib/checkoutDisplay";
import { resolveVenueThreadCatalogPricing } from "@/lib/catalogPricingMode";
import { parseEventTypesList } from "@/lib/venueEditFormParse";
import type { StoredServiceChoice } from "@/lib/venueInquiryAmenities";
import {
  resolveInquiryCheckoutAmountNis,
  resolveServiceRequestCheckoutAmountNis,
} from "@/lib/bookingAmount";
import { isBookingPaymentsEnabled } from "@/lib/bookingPaymentConfig";

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
  searchParams: Promise<{ inquiryId?: string; serviceRequestId?: string }>;
}) {
  const user = await requireVerifiedSession("/checkout");
  if (user.role !== "SEEKER") redirect("/");

  const { inquiryId: inquiryIdRaw, serviceRequestId: serviceRequestIdRaw } =
    await searchParams;
  const bookingPaymentsEnabled = isBookingPaymentsEnabled();

  const serviceRequestId = Number(serviceRequestIdRaw);
  if (
    Number.isInteger(serviceRequestId) &&
    serviceRequestId > 0 &&
    !inquiryIdRaw
  ) {
    const sr = await prisma.serviceRequest.findFirst({
      where: { id: serviceRequestId, userId: user.id },
      select: {
        id: true,
        serviceId: true,
        eventType: true,
        preferredDate: true,
        status: true,
        service: {
          select: {
            name: true,
            category: true,
            minPrice: true,
            maxPrice: true,
          },
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
    if (!sr) redirect("/my-service-requests");
    if (sr.status === "PAID") redirect("/my-service-requests");

    const accepted = sr.negotiationThread?.offers[0];
    const acceptedExact =
      accepted != null
        ? (accepted.amountMinNis ?? accepted.amountMaxNis)
        : null;

    const amountResult = bookingPaymentsEnabled
      ? await resolveServiceRequestCheckoutAmountNis(serviceRequestId, user.id)
      : null;

    const order = serviceRequestToCheckoutSummary(sr, {
      acceptedExactAmount: acceptedExact,
      fixedCatalogAmount:
        amountResult?.ok && amountResult.source === "fixed_catalog"
          ? amountResult.amountNis
          : null,
    });

    return (
      <SitePageShell mainWidth="wide">
        <CheckoutClient
          user={{ name: user.name, email: user.email }}
          order={order}
          bookingPaymentsEnabled={bookingPaymentsEnabled}
          payAmountNis={amountResult?.ok ? amountResult.amountNis : null}
          canPay={amountResult?.ok ?? false}
          payBlockedReason={
            amountResult && !amountResult.ok ? amountResult.error : null
          }
        />
      </SitePageShell>
    );
  }

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
      status: true,
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
  if (inquiry.status === "PAID") redirect(`/my-inquiries/${inquiryId}`);

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

  const amountResult = bookingPaymentsEnabled
    ? await resolveInquiryCheckoutAmountNis(inquiryId, user.id)
    : null;

  const order = inquiryToCheckoutSummary(inquiry, {
    acceptedExactAmount: acceptedExact,
    fixedCatalogAmount:
      venueCatalog.pricingMode === "fixed"
        ? venueCatalog.exactAmount
        : amountResult?.ok && amountResult.source === "fixed_catalog"
          ? amountResult.amountNis
          : null,
  });

  return (
    <SitePageShell mainWidth="wide">
      <CheckoutClient
        user={{ name: user.name, email: user.email }}
        order={order}
        bookingPaymentsEnabled={bookingPaymentsEnabled}
        payAmountNis={amountResult?.ok ? amountResult.amountNis : null}
        canPay={amountResult?.ok ?? false}
        payBlockedReason={
          amountResult && !amountResult.ok ? amountResult.error : null
        }
      />
    </SitePageShell>
  );
}
