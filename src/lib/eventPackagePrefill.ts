import "server-only";

import type { InquiryAddonFreelancerPick } from "@/lib/inquiryAddonFreelancers";
import {
  parseEventTypesJson,
  parseServiceSlotsJson,
  parseVenueIncludesJson,
} from "@/lib/eventPackageTypes";
import type { InquiryPrefillPayload } from "@/lib/inquiryPrefill";
import { inferEventTypeFromPackageText } from "@/lib/packageInquiryPrefill";
import {
  newBundleItemId,
  type SeekerBundleItem,
} from "@/lib/seekerEventBundleTypes";
import type { ServiceChoiceSource } from "@/lib/venueInquiryAmenities";
import {
  getVenueInquiryOptions,
  type VenueInquiryAmenitiesInput,
} from "@/lib/venueInquiryAmenities";

export type EventPackageForPrefill = {
  id: number;
  title: string;
  subtitle: string | null;
  bundlePriceFrom: number | null;
  bundlePriceTo: number | null;
  guestMin: number | null;
  guestMax: number | null;
  eventTypesJson: string | null;
  venueIncludesJson: string | null;
  serviceSlotsJson: string | null;
  services: Array<{
    serviceId: number;
    service: {
      id: number;
      name: string;
      minPrice: number | null;
      maxPrice: number | null;
      provider: { name: string | null; businessName: string | null };
    };
  }>;
};

export type VenueForPackagePrefill = {
  id: number;
  name: string;
  minGuests: number | null;
  hallRentalMin: number | null;
  hallRentalMax: number | null;
  minPrice: number | null;
  maxPrice: number | null;
} & VenueInquiryAmenitiesInput;

export function estimatePackagePriceRange(
  pkg: Pick<EventPackageForPrefill, "bundlePriceFrom" | "bundlePriceTo" | "services">
): { min: number; max: number } {
  const serviceMin = pkg.services.reduce(
    (sum, row) => sum + (row.service.minPrice ?? 0),
    0
  );
  const serviceMax = pkg.services.reduce(
    (sum, row) =>
      sum + (row.service.maxPrice ?? row.service.minPrice ?? 0),
    0
  );
  const hallMin = pkg.bundlePriceFrom ?? 0;
  const hallMax = pkg.bundlePriceTo ?? pkg.bundlePriceFrom ?? 0;
  return {
    min: hallMin + (serviceMin > 0 ? serviceMin : 0),
    max: (hallMax || hallMin) + (serviceMax > 0 ? serviceMax : 0),
  };
}

/** המרת חבילת קטלוג לפריטי SeekerEventBundle */
export function packageToBundleItems(
  pkg: EventPackageForPrefill,
  venue: VenueForPackagePrefill
): SeekerBundleItem[] {
  const items: SeekerBundleItem[] = [];
  const hallFrom = venue.hallRentalMin ?? venue.minPrice;
  const hallTo = venue.hallRentalMax ?? venue.maxPrice ?? hallFrom;

  items.push({
    id: newBundleItemId(),
    slotKey: "venue_hall",
    label: venue.name,
    kind: "venue_hall",
    source: "venue",
    priceFrom: hallFrom,
    priceTo: hallTo ?? hallFrom,
  });

  const { services: options } = getVenueInquiryOptions(venue, undefined);
  const optionById = new Map(options.map((o) => [o.id, o]));
  const venueIncludes = parseVenueIncludesJson(pkg.venueIncludesJson);

  for (const inc of venueIncludes) {
    const opt = optionById.get(inc.venueOptionId);
    if (!opt) continue;
    items.push({
      id: newBundleItemId(),
      slotKey: inc.venueOptionId,
      label: opt.label,
      kind: opt.priceMode === "extra" ? "venue_extra" : "venue_included",
      venueOptionId: inc.venueOptionId,
      source: "venue",
      priceFrom: opt.extraPrice,
      priceTo: opt.extraPriceMax ?? opt.extraPrice,
    });
  }

  const slots = parseServiceSlotsJson(pkg.serviceSlotsJson);
  const serviceById = new Map(pkg.services.map((r) => [r.serviceId, r.service]));

  for (const slot of slots) {
    const sid = slot.serviceId;
    if (!sid) continue;
    const svc = serviceById.get(sid);
    if (!svc) continue;
    const providerName = svc.provider.businessName ?? svc.provider.name ?? "ספק";
    items.push({
      id: newBundleItemId(),
      slotKey: `marketplace:${sid}`,
      label: svc.name,
      kind: "marketplace",
      serviceId: sid,
      serviceName: svc.name,
      source: slot.allowAlternatives ? "external" : "external",
      priceFrom: svc.minPrice,
      priceTo: svc.maxPrice ?? svc.minPrice,
      note: `${slot.role} · ${providerName}`,
    });
  }

  for (const row of pkg.services) {
    if (slots.some((s) => s.serviceId === row.serviceId)) continue;
    const svc = row.service;
    items.push({
      id: newBundleItemId(),
      slotKey: `marketplace:${svc.id}`,
      label: svc.name,
      kind: "marketplace",
      serviceId: svc.id,
      serviceName: svc.name,
      source: "external",
      priceFrom: svc.minPrice,
      priceTo: svc.maxPrice ?? svc.minPrice,
    });
  }

  return items;
}

/** בניית prefill מלא לטופס הזמנה מאולם */
export function buildInquiryPrefillFromPackage(
  pkg: EventPackageForPrefill,
  venue: VenueForPackagePrefill
): InquiryPrefillPayload {
  const sourceById: Record<string, ServiceChoiceSource> = {};
  const selectedExtraOptionIds: string[] = [];
  const addonFreelancers: InquiryAddonFreelancerPick[] = [];
  const { services: options } = getVenueInquiryOptions(venue, undefined);
  const optionById = new Map(options.map((o) => [o.id, o]));

  for (const inc of parseVenueIncludesJson(pkg.venueIncludesJson)) {
    const opt = optionById.get(inc.venueOptionId);
    if (!opt) continue;
    sourceById[inc.venueOptionId] = "venue";
    if (opt.priceMode === "extra") {
      selectedExtraOptionIds.push(inc.venueOptionId);
    }
  }

  const slots = parseServiceSlotsJson(pkg.serviceSlotsJson);
  const serviceById = new Map(pkg.services.map((r) => [r.serviceId, r.service]));
  const linkedServiceIds = new Set<number>();

  for (const slot of slots) {
    if (!slot.serviceId) continue;
    const svc = serviceById.get(slot.serviceId);
    if (!svc) continue;
    linkedServiceIds.add(slot.serviceId);
    if (slot.mode === "included" || slot.mode === "recommended") {
      addonFreelancers.push({
        serviceId: svc.id,
        name: svc.name,
        providerName: svc.provider.businessName ?? svc.provider.name ?? "ספק",
        category: slot.role || null,
        minPrice: svc.minPrice,
        maxPrice: svc.maxPrice,
      });
    }
  }

  for (const row of pkg.services) {
    if (linkedServiceIds.has(row.serviceId)) continue;
    const svc = row.service;
    addonFreelancers.push({
      serviceId: svc.id,
      name: svc.name,
      providerName: svc.provider.businessName ?? svc.provider.name ?? "ספק",
      category: null,
      minPrice: svc.minPrice,
      maxPrice: svc.maxPrice,
    });
  }

  const serviceNames = pkg.services.map((r) => r.service.name).join(", ");
  const message = `מעוניין/ת בחבילה "${pkg.title}"${serviceNames ? ` הכוללת: ${serviceNames}` : ""}.`;

  const eventTypes = parseEventTypesJson(pkg.eventTypesJson);
  const eventType =
    eventTypes[0] ??
    inferEventTypeFromPackageText(pkg.title, pkg.subtitle) ??
    undefined;

  const guestCount =
    pkg.guestMin != null && pkg.guestMin > 0
      ? String(pkg.guestMin)
      : venue.minGuests != null && venue.minGuests > 0
        ? String(venue.minGuests)
        : undefined;

  const price = estimatePackagePriceRange(pkg);

  return {
    sourceById: Object.keys(sourceById).length > 0 ? sourceById : undefined,
    selectedExtraOptionIds:
      selectedExtraOptionIds.length > 0 ? selectedExtraOptionIds : undefined,
    addonFreelancers:
      addonFreelancers.length > 0 ? addonFreelancers : undefined,
    message,
    eventType,
    guestCount,
    eventPackageId: pkg.id,
    priceEstimateMin: price.min > 0 ? price.min : undefined,
    priceEstimateMax: price.max > 0 ? price.max : undefined,
  };
}
