/** מצב תמחור מקטלוג: מחיר קבוע מול טווח שדורש ציטוט מדויק */

import { parseVenueEventTypeProfilesForPublic } from "@/lib/venueEventTypeProfilesPublic";
import type { StoredServiceChoice } from "@/lib/venueInquiryAmenities";

export type CatalogPricingMode = "fixed" | "range" | "unset";

export function getCatalogPricingMode(
  min: number | null | undefined,
  max: number | null | undefined
): CatalogPricingMode {
  if (min == null && max == null) return "unset";
  const lo = min ?? max!;
  const hi = max ?? min!;
  if (lo === hi) return "fixed";
  return "range";
}

export function isFixedCatalogPrice(
  min: number | null | undefined,
  max: number | null | undefined
): boolean {
  return getCatalogPricingMode(min, max) === "fixed";
}

export function isRangeCatalogPrice(
  min: number | null | undefined,
  max: number | null | undefined
): boolean {
  return getCatalogPricingMode(min, max) === "range";
}

/** מאחד שורות רלוונטיות: טווח גובר; אם אין שורות — unset */
export function mergeCatalogPricingModes(
  modes: CatalogPricingMode[]
): CatalogPricingMode {
  const relevant = modes.filter((m) => m !== "unset");
  if (relevant.length === 0) return "unset";
  if (relevant.some((m) => m === "range")) return "range";
  return "fixed";
}

export type CatalogBounds = {
  pricingMode: CatalogPricingMode;
  catalogMin: number | null;
  catalogMax: number | null;
  /** סכום מדויק כשכל השורות הרלוונטיות קבועות */
  exactAmount: number | null;
};

function addBounds(
  acc: { min: number; max: number } | null,
  lineMin: number | null,
  lineMax: number | null
): { min: number; max: number } | null {
  if (lineMin == null && lineMax == null) return acc;
  const lo = lineMin ?? lineMax!;
  const hi = lineMax ?? lineMin!;
  if (!acc) return { min: lo, max: hi };
  return { min: acc.min + lo, max: acc.max + hi };
}

/**
 * תמחור שרשור אולם: השכרה + מנה×אורחים (אם רלוונטי) + תוספות venue בבחירות.
 * אם אחת מהשורות הרלוונטיות היא טווח — השרשור ב־range.
 */
export function resolveVenueThreadCatalogPricing(input: {
  hallRentalMin: number | null;
  hallRentalMax: number | null;
  venueMinPrice: number | null;
  venueMaxPrice: number | null;
  guestCount: number | null;
  eventType: string | null;
  eventTypeProfilesJson: string | null;
  eventTypes: string[];
  serviceChoices: StoredServiceChoice[];
}): CatalogBounds {
  const hallMin = input.hallRentalMin ?? input.venueMinPrice;
  const hallMax = input.hallRentalMax ?? input.venueMaxPrice ?? hallMin;
  const modes: CatalogPricingMode[] = [];
  let totals: { min: number; max: number } | null = null;

  const hallMode = getCatalogPricingMode(hallMin, hallMax);
  if (hallMode !== "unset") {
    modes.push(hallMode);
    totals = addBounds(totals, hallMin, hallMax);
  }

  const guests =
    input.guestCount != null &&
    Number.isFinite(input.guestCount) &&
    input.guestCount > 0
      ? Math.trunc(input.guestCount)
      : null;

  if (guests != null && input.eventType?.trim()) {
    const profiles = parseVenueEventTypeProfilesForPublic(
      input.eventTypeProfilesJson,
      input.eventTypes.length > 0 ? input.eventTypes : [input.eventType]
    );
    const p = profiles[input.eventType];
    if (p?.hasFoodAtEvent && (p.minPrice != null || p.maxPrice != null)) {
      const mealMin = (p.minPrice ?? p.maxPrice!) * guests;
      const mealMax = (p.maxPrice ?? p.minPrice!) * guests;
      modes.push(getCatalogPricingMode(mealMin, mealMax));
      totals = addBounds(totals, mealMin, mealMax);
    }
  }

  for (const row of input.serviceChoices) {
    if (row.source !== "venue") continue;
    if (row.priceMode !== "extra") continue;
    const minP = row.extraPrice;
    const maxP = row.extraPriceMax ?? row.extraPrice;
    if (minP == null || !Number.isFinite(minP)) continue;
    const lo = Math.trunc(minP);
    const hi =
      maxP != null && Number.isFinite(maxP) ? Math.trunc(maxP) : lo;
    modes.push(getCatalogPricingMode(lo, hi));
    totals = addBounds(totals, lo, hi);
  }

  const pricingMode = mergeCatalogPricingModes(modes);
  if (!totals) {
    return {
      pricingMode: "unset",
      catalogMin: null,
      catalogMax: null,
      exactAmount: null,
    };
  }

  return {
    pricingMode,
    catalogMin: totals.min,
    catalogMax: totals.max,
    exactAmount: pricingMode === "fixed" ? totals.min : null,
  };
}

export function resolveServiceCatalogPricing(
  minPrice: number | null,
  maxPrice: number | null
): CatalogBounds {
  const mode = getCatalogPricingMode(minPrice, maxPrice);
  if (mode === "unset") {
    return {
      pricingMode: "unset",
      catalogMin: null,
      catalogMax: null,
      exactAmount: null,
    };
  }
  const lo = minPrice ?? maxPrice!;
  const hi = maxPrice ?? minPrice!;
  return {
    pricingMode: mode,
    catalogMin: lo,
    catalogMax: hi,
    exactAmount: mode === "fixed" ? lo : null,
  };
}

/** ציטוט מדויק חייב ליפול בטווח הקטלוג כששני הקצוות ידועים */
export function isExactQuoteWithinCatalog(
  amount: number,
  catalogMin: number | null,
  catalogMax: number | null
): boolean {
  if (catalogMin != null && amount < catalogMin) return false;
  if (catalogMax != null && amount > catalogMax) return false;
  return true;
}

export function countProviderQuotes(
  offers: Array<{ authorRole: string; status: string }>
): number {
  return offers.filter((o) => {
    const role = o.authorRole.toUpperCase();
    if (role !== "VENUE_OWNER" && role !== "FREELANCER") return false;
    const s = o.status.toUpperCase();
    return s !== "WITHDRAWN";
  }).length;
}

export function maxProviderQuotesAllowed(
  seekerReQuoteRequestedAt: Date | string | null | undefined
): number {
  return seekerReQuoteRequestedAt ? 2 : 1;
}

export type NegotiationPricingFlags = {
  pricingMode: CatalogPricingMode;
  catalogMin: number | null;
  catalogMax: number | null;
  exactAmount: number | null;
  reQuoteUsed: boolean;
  reQuoteAllowed: boolean;
  canProviderQuote: boolean;
  canSeekerRequestReQuote: boolean;
  canSeekerDecide: boolean;
  pendingProviderOfferId: number | null;
};

export function buildNegotiationPricingFlags(input: {
  pricingMode: CatalogPricingMode;
  catalogMin: number | null;
  catalogMax: number | null;
  exactAmount: number | null;
  threadStatus: string;
  seekerReQuoteRequestedAt: Date | string | null | undefined;
  offers: Array<{
    id: number;
    authorRole: string;
    authorUserId: number;
    status: string;
  }>;
  currentUserRole: "SEEKER" | "VENUE_OWNER" | "FREELANCER";
  isProviderForThread: boolean;
}): NegotiationPricingFlags {
  const open = input.threadStatus === "OPEN";
  const reQuoteUsed = Boolean(input.seekerReQuoteRequestedAt);
  const providerQuoteCount = countProviderQuotes(input.offers);
  const maxQuotes = maxProviderQuotesAllowed(input.seekerReQuoteRequestedAt);

  const pendingProvider = input.offers.find((o) => {
    if (o.status.toUpperCase() !== "PENDING") return false;
    const role = o.authorRole.toUpperCase();
    return role === "VENUE_OWNER" || role === "FREELANCER";
  });

  const hasRejectedProviderQuote = input.offers.some((o) => {
    if (o.status.toUpperCase() !== "REJECTED") return false;
    const role = o.authorRole.toUpperCase();
    return role === "VENUE_OWNER" || role === "FREELANCER";
  });

  const needsQuote =
    input.pricingMode === "range" || input.pricingMode === "unset";

  const canProviderQuote =
    open &&
    needsQuote &&
    input.isProviderForThread &&
    !pendingProvider &&
    providerQuoteCount < maxQuotes;

  const canSeekerRequestReQuote =
    open &&
    needsQuote &&
    input.currentUserRole === "SEEKER" &&
    !reQuoteUsed &&
    (Boolean(pendingProvider) || hasRejectedProviderQuote);

  const canSeekerDecide =
    open &&
    needsQuote &&
    input.currentUserRole === "SEEKER" &&
    Boolean(pendingProvider);

  return {
    pricingMode: input.pricingMode,
    catalogMin: input.catalogMin,
    catalogMax: input.catalogMax,
    exactAmount: input.exactAmount,
    reQuoteUsed,
    reQuoteAllowed: !reQuoteUsed && needsQuote,
    canProviderQuote,
    canSeekerRequestReQuote,
    canSeekerDecide,
    pendingProviderOfferId: pendingProvider?.id ?? null,
  };
}

export function assertCanCreateExactQuote(input: {
  role: "SEEKER" | "VENUE_OWNER" | "FREELANCER";
  catalog: CatalogBounds;
  threadStatus: string;
  seekerReQuoteRequestedAt: Date | string | null;
  offers: Array<{ authorRole: string; status: string }>;
  amountMinNis: number;
  amountMaxNis: number | null;
}): { ok: true; exactAmount: number } | { ok: false; error: string } {
  if (input.threadStatus !== "OPEN") {
    return { ok: false, error: "השרשור סגור למשא ומתן" };
  }

  if (input.catalog.pricingMode === "fixed") {
    return {
      ok: false,
      error: "המחיר בקטלוג קבוע — אין צורך בהצעת מחיר",
    };
  }

  if (input.role === "SEEKER") {
    return { ok: false, error: "רק הספק יכול לשלוח מחיר מדויק" };
  }

  const exact =
    input.amountMaxNis == null || input.amountMaxNis === input.amountMinNis
      ? input.amountMinNis
      : null;
  if (exact == null) {
    return { ok: false, error: "יש לשלוח מחיר מדויק אחד (לא טווח)" };
  }

  if (
    !isExactQuoteWithinCatalog(
      exact,
      input.catalog.catalogMin,
      input.catalog.catalogMax
    )
  ) {
    return {
      ok: false,
      error: "המחיר חייב להיות בטווח שפורסם בקטלוג",
    };
  }

  const pending = input.offers.some((o) => {
    if (o.status.toUpperCase() !== "PENDING") return false;
    const role = o.authorRole.toUpperCase();
    return role === "VENUE_OWNER" || role === "FREELANCER";
  });
  if (pending) {
    return { ok: false, error: "כבר יש ציטוט ממתין בשרשור" };
  }

  const quoted = countProviderQuotes(input.offers);
  const max = maxProviderQuotesAllowed(input.seekerReQuoteRequestedAt);
  if (quoted >= max) {
    return {
      ok: false,
      error: input.seekerReQuoteRequestedAt
        ? "כבר נשלחו שני ציטוטים — הממתינים יכולים רק לאשר או לדחות"
        : "כבר נשלח ציטוט — המבקש יכול לבקש ציטוט מחדש פעם אחת",
    };
  }

  return { ok: true, exactAmount: exact };
}
