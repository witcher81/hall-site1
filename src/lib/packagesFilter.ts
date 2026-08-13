import type { Prisma } from "@prisma/client";
import { parsePackageTier } from "@/lib/eventPackageTypes";
import { eventTypeSearchContainsVariants } from "@/lib/eventTypeOptions";
import { publicPackageWhere } from "@/lib/listingModerationTypes";

export type PackagesListSort = "order" | "price_low" | "price_high";

export type PackagesSearchInput = {
  q: string;
  city: string;
  venueId: string;
  tier: string;
  eventType: string;
  minGuests: string;
  maxGuests: string;
  bundleMin: string;
  bundleMax: string;
  sort: PackagesListSort;
};

export function parsePackagesSearchParams(
  raw: Record<string, string | string[] | undefined>
): PackagesSearchInput {
  const pick = (k: string) => {
    const v = raw[k];
    return typeof v === "string" ? v : "";
  };
  const sortRaw = pick("sort");
  const sort: PackagesListSort =
    sortRaw === "price_low" || sortRaw === "price_high" ? sortRaw : "order";

  const legacyGuests = pick("guests").trim();
  const legacyBudget = pick("budgetMax").trim();

  return {
    q: pick("q").trim(),
    city: pick("city").trim(),
    venueId: pick("venueId").trim(),
    tier: pick("tier").trim(),
    eventType: pick("eventType").trim(),
    minGuests: pick("minGuests").trim() || legacyGuests,
    maxGuests: pick("maxGuests").trim(),
    bundleMin: pick("bundleMin").trim(),
    bundleMax: pick("bundleMax").trim() || legacyBudget,
    sort,
  };
}

export function buildEventPackageWhere(
  input: PackagesSearchInput
): Prisma.EventPackageWhereInput {
  const conditions: Prisma.EventPackageWhereInput[] = [publicPackageWhere()];

  if (input.q) {
    const q = input.q;
    conditions.push({
      OR: [
        { title: { contains: q } },
        { subtitle: { contains: q } },
        { description: { contains: q } },
        { venue: { name: { contains: q } } },
        { venue: { city: { contains: q } } },
        { services: { some: { service: { name: { contains: q } } } } },
        { services: { some: { service: { category: { contains: q } } } } },
      ],
    });
  }

  const venueId = Number(input.venueId);
  if (Number.isInteger(venueId) && venueId > 0) {
    conditions.push({ venueId });
  }

  const tier = parsePackageTier(input.tier);
  if (tier) {
    conditions.push({ tier });
  }

  const eventType = input.eventType.trim();
  if (eventType) {
    const variants = eventTypeSearchContainsVariants(eventType);
    if (variants.length === 1) {
      conditions.push({ eventTypesJson: { contains: variants[0] } });
    } else {
      conditions.push({
        OR: variants.map((v) => ({ eventTypesJson: { contains: v } })),
      });
    }
  }

  const city = input.city.trim();
  if (city.length > 0) {
    conditions.push({ venue: { city: { contains: city } } });
  }

  const minG = input.minGuests !== "" ? Number(input.minGuests) : NaN;
  const maxG = input.maxGuests !== "" ? Number(input.maxGuests) : NaN;
  const guestLimits = [minG, maxG].filter((n) => Number.isFinite(n) && n > 0);
  if (guestLimits.length > 0) {
    const required = Math.max(...guestLimits);
    conditions.push({ venue: { maxGuests: { gte: Math.floor(required) } } });
  }

  const bMax = Number(input.bundleMax);
  if (Number.isFinite(bMax) && bMax > 0) {
    const B = Math.floor(bMax);
    conditions.push({
      OR: [{ bundlePriceFrom: null }, { bundlePriceFrom: { lte: B } }],
    });
  }

  const bMin = Number(input.bundleMin);
  if (Number.isFinite(bMin) && bMin > 0) {
    const B = Math.floor(bMin);
    conditions.push({
      OR: [
        { bundlePriceTo: { gte: B } },
        {
          AND: [
            { bundlePriceTo: null },
            {
              OR: [{ bundlePriceFrom: null }, { bundlePriceFrom: { gte: B } }],
            },
          ],
        },
      ],
    });
  }

  return { AND: conditions };
}

export function eventPackageOrderBy(
  sort: PackagesListSort
): Prisma.EventPackageOrderByWithRelationInput[] {
  switch (sort) {
    case "price_low":
      return [{ bundlePriceFrom: "asc" }, { sortOrder: "asc" }, { id: "asc" }];
    case "price_high":
      return [{ bundlePriceFrom: "desc" }, { sortOrder: "asc" }, { id: "asc" }];
    default:
      return [{ sortOrder: "asc" }, { id: "asc" }];
  }
}
