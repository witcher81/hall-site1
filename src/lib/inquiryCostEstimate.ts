import { parseVenueEventTypeProfilesForPublic } from "@/lib/venueEventTypeProfilesPublic";
import type { StoredServiceChoice } from "@/lib/venueInquiryAmenities";

export type InquiryCostLine = {
  label: string;
  amountMin: number | null;
  amountMax: number | null;
};

export type InquiryCostEstimate = {
  lines: InquiryCostLine[];
  totalMin: number | null;
  totalMax: number | null;
  hasEstimate: boolean;
};

function mealPriceForEvent(
  eventType: string | null,
  eventTypeProfilesJson: string | null,
  eventTypes: string[]
): { min: number | null; max: number | null } {
  if (!eventType?.trim()) return { min: null, max: null };
  const profiles = parseVenueEventTypeProfilesForPublic(
    eventTypeProfilesJson,
    eventTypes.length > 0 ? eventTypes : [eventType]
  );
  const p = profiles[eventType];
  if (!p?.hasFoodAtEvent) return { min: null, max: null };
  return { min: p.minPrice, max: p.maxPrice };
}

export function estimateInquiryOrderCost(input: {
  guestCount: number | null;
  eventType: string | null;
  eventTypeProfilesJson: string | null;
  eventTypes: string[];
  serviceChoices: StoredServiceChoice[];
}): InquiryCostEstimate {
  const lines: InquiryCostLine[] = [];
  let totalMin = 0;
  let totalMax = 0;
  let hasAny = false;

  const guests =
    input.guestCount != null && Number.isFinite(input.guestCount) && input.guestCount > 0
      ? Math.trunc(input.guestCount)
      : null;

  const meal = mealPriceForEvent(
    input.eventType,
    input.eventTypeProfilesJson,
    input.eventTypes
  );

  if (guests != null && (meal.min != null || meal.max != null)) {
    const minP = meal.min ?? meal.max;
    const maxP = meal.max ?? meal.min;
    if (minP != null) {
      const lineMin = minP * guests;
      const lineMax = (maxP ?? minP) * guests;
      lines.push({
        label: `אוכל (מנה × ${guests} אורחים)`,
        amountMin: lineMin,
        amountMax: lineMax !== lineMin ? lineMax : null,
      });
      totalMin += lineMin;
      totalMax += lineMax;
      hasAny = true;
    }
  }

  for (const row of input.serviceChoices) {
    if (row.source !== "venue") continue;
    if (row.priceMode !== "extra") continue;
    const price = row.extraPrice;
    if (price == null || !Number.isFinite(price)) continue;
    const amt = Math.trunc(price);
    lines.push({
      label: row.label,
      amountMin: amt,
      amountMax: null,
    });
    totalMin += amt;
    totalMax += amt;
    hasAny = true;
  }

  return {
    lines,
    totalMin: hasAny ? totalMin : null,
    totalMax: hasAny && totalMax !== totalMin ? totalMax : hasAny ? totalMin : null,
    hasEstimate: hasAny,
  };
}

export function formatNisRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "—";
  if (min != null && max != null && max !== min) {
    return `₪${min.toLocaleString("he-IL")}–₪${max.toLocaleString("he-IL")}`;
  }
  const v = min ?? max;
  return v != null ? `₪${v.toLocaleString("he-IL")}` : "—";
}
