import {
  parseEventTypesJson,
  parsePackageTier,
  parseServiceSlotsJson,
  parseVenueIncludesJson,
  serializeEventTypesJson,
  serializeServiceSlotsJson,
  serializeVenueIncludesJson,
  type EventPackageServiceSlot,
  type EventPackageVenueInclude,
  type PackageTier,
} from "@/lib/eventPackageTypes";

export type EventPackageWriteBody = {
  title?: string;
  subtitle?: string | null;
  description?: string | null;
  bundlePriceFrom?: number | null;
  bundlePriceTo?: number | null;
  badgeLabel?: string | null;
  tier?: PackageTier | null;
  eventTypes?: string[];
  guestMin?: number | null;
  guestMax?: number | null;
  venueIncludes?: EventPackageVenueInclude[];
  serviceSlots?: EventPackageServiceSlot[];
  serviceIds?: number[];
  isPublished?: boolean;
  sortOrder?: number;
};

export function parseEventPackageWriteBody(
  body: Record<string, unknown>
): { ok: true; data: EventPackageWriteBody } | { ok: false; error: string } {
  const data: EventPackageWriteBody = {};

  if (typeof body.title === "string") {
    const t = body.title.trim().slice(0, 200);
    if (!t) return { ok: false, error: "כותרת חובה" };
    data.title = t;
  }

  if (body.subtitle !== undefined) {
    data.subtitle =
      typeof body.subtitle === "string" ? body.subtitle.trim().slice(0, 300) || null : null;
  }
  if (body.description !== undefined) {
    data.description =
      typeof body.description === "string"
        ? body.description.trim().slice(0, 5000) || null
        : null;
  }
  if (body.badgeLabel !== undefined) {
    data.badgeLabel =
      typeof body.badgeLabel === "string"
        ? body.badgeLabel.trim().slice(0, 80) || null
        : null;
  }
  if (body.tier !== undefined) {
    data.tier = body.tier === null || body.tier === "" ? null : parsePackageTier(body.tier);
  }
  if (body.bundlePriceFrom !== undefined) {
    const n = body.bundlePriceFrom === null || body.bundlePriceFrom === "" ? null : Number(body.bundlePriceFrom);
    data.bundlePriceFrom = n != null && Number.isFinite(n) ? Math.trunc(n) : null;
  }
  if (body.bundlePriceTo !== undefined) {
    const n = body.bundlePriceTo === null || body.bundlePriceTo === "" ? null : Number(body.bundlePriceTo);
    data.bundlePriceTo = n != null && Number.isFinite(n) ? Math.trunc(n) : null;
  }
  if (body.guestMin !== undefined) {
    const n = body.guestMin === null || body.guestMin === "" ? null : Number(body.guestMin);
    data.guestMin = n != null && Number.isInteger(n) && n > 0 ? n : null;
  }
  if (body.guestMax !== undefined) {
    const n = body.guestMax === null || body.guestMax === "" ? null : Number(body.guestMax);
    data.guestMax = n != null && Number.isInteger(n) && n > 0 ? n : null;
  }
  if (Array.isArray(body.eventTypes)) {
    data.eventTypes = body.eventTypes
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
  }
  if (Array.isArray(body.venueIncludes)) {
    const list: EventPackageVenueInclude[] = [];
    for (const row of body.venueIncludes) {
      if (typeof row !== "object" || row === null) continue;
      const id = (row as { venueOptionId?: unknown }).venueOptionId;
      if (typeof id === "string" && id.trim()) list.push({ venueOptionId: id.trim() });
    }
    data.venueIncludes = list;
  }
  if (Array.isArray(body.serviceSlots)) {
    const parsed = parseServiceSlotsJson(JSON.stringify(body.serviceSlots));
    data.serviceSlots = parsed;
  }
  if (Array.isArray(body.serviceIds)) {
    data.serviceIds = body.serviceIds
      .map((x) => Number(x))
      .filter((n) => Number.isInteger(n) && n > 0);
  }
  if (typeof body.isPublished === "boolean") data.isPublished = body.isPublished;
  if (body.sortOrder !== undefined) {
    const n = Number(body.sortOrder);
    data.sortOrder = Number.isInteger(n) ? n : 0;
  }

  return { ok: true, data };
}

export function prismaDataFromPackageWrite(
  data: EventPackageWriteBody
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.title !== undefined) out.title = data.title;
  if (data.subtitle !== undefined) out.subtitle = data.subtitle;
  if (data.description !== undefined) out.description = data.description;
  if (data.bundlePriceFrom !== undefined) out.bundlePriceFrom = data.bundlePriceFrom;
  if (data.bundlePriceTo !== undefined) out.bundlePriceTo = data.bundlePriceTo;
  if (data.badgeLabel !== undefined) out.badgeLabel = data.badgeLabel;
  if (data.tier !== undefined) out.tier = data.tier;
  if (data.guestMin !== undefined) out.guestMin = data.guestMin;
  if (data.guestMax !== undefined) out.guestMax = data.guestMax;
  if (data.eventTypes !== undefined) {
    out.eventTypesJson = serializeEventTypesJson(data.eventTypes);
  }
  if (data.venueIncludes !== undefined) {
    out.venueIncludesJson = serializeVenueIncludesJson(data.venueIncludes);
  }
  if (data.serviceSlots !== undefined) {
    out.serviceSlotsJson = serializeServiceSlotsJson(data.serviceSlots);
  }
  if (data.isPublished !== undefined) out.isPublished = data.isPublished;
  if (data.sortOrder !== undefined) out.sortOrder = data.sortOrder;
  return out;
}

export function packageRowToClient(pkg: {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  bundlePriceFrom: number | null;
  bundlePriceTo: number | null;
  badgeLabel: string | null;
  tier: string | null;
  eventTypesJson: string | null;
  guestMin: number | null;
  guestMax: number | null;
  venueIncludesJson: string | null;
  serviceSlotsJson: string | null;
  isPublished: boolean;
  sortOrder: number;
  services: { serviceId: number }[];
}) {
  return {
    id: pkg.id,
    title: pkg.title,
    subtitle: pkg.subtitle,
    description: pkg.description,
    bundlePriceFrom: pkg.bundlePriceFrom,
    bundlePriceTo: pkg.bundlePriceTo,
    badgeLabel: pkg.badgeLabel,
    tier: pkg.tier,
    eventTypes: parseEventTypesJson(pkg.eventTypesJson),
    guestMin: pkg.guestMin,
    guestMax: pkg.guestMax,
    venueIncludes: parseVenueIncludesJson(pkg.venueIncludesJson),
    serviceSlots: parseServiceSlotsJson(pkg.serviceSlotsJson),
    isPublished: pkg.isPublished,
    sortOrder: pkg.sortOrder,
    serviceIds: pkg.services.map((s) => s.serviceId),
  };
}
