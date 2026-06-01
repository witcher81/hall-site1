import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SitePageShell from "@/components/layout/SitePageShell";
import {
  HALL_BUILTIN_LABELS,
  type HallMoneyBuiltinKey,
  providerCategoryForCustomLabel,
  providerCategoryForHallBuiltin,
  type SavingsOpportunityPayload,
} from "@/lib/venueAfterHallGuide";
import AfterVenueGuideClient from "./AfterVenueGuideClient";

export const runtime = "nodejs";

type PriceMode = "included" | "extra";

type BuiltinAmenityKey = HallMoneyBuiltinKey;

function parseVenueMoneyRows(customAmenitiesJson: string | null): {
  amenityExtraPrices: Partial<Record<BuiltinAmenityKey, number>>;
  customExtras: { label: string; price: number }[];
} {
  const amenityExtraPrices: Partial<Record<BuiltinAmenityKey, number>> = {};
  const customExtras: { label: string; price: number }[] = [];

  if (!customAmenitiesJson) {
    return { amenityExtraPrices, customExtras };
  }
  try {
    const v = JSON.parse(customAmenitiesJson) as unknown;
    if (!Array.isArray(v)) return { amenityExtraPrices, customExtras };
    for (const item of v) {
      if (typeof item !== "object" || item === null) continue;
      const o = item as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label.trim() : "";
      if (!label) continue;
      const checked = o.checked === true;
      const priceMode = o.priceMode === "extra" ? "extra" : "included";
      const extraPrice =
        typeof o.extraPrice === "number" && Number.isFinite(o.extraPrice)
          ? Math.trunc(o.extraPrice)
          : null;
      if (label.startsWith("__builtin__:")) {
        const key = label.slice("__builtin__:".length) as BuiltinAmenityKey;
        if (
          key === "hasFood" ||
          key === "hasDanceFloor" ||
          key === "hasTableSetup" ||
          key === "hasSoundSystem"
        ) {
          if (
            priceMode === "extra" &&
            typeof extraPrice === "number" &&
            extraPrice > 0
          ) {
            amenityExtraPrices[key] = extraPrice;
          }
        }
        continue;
      }
      if (checked && priceMode === "extra" && extraPrice != null && extraPrice > 0) {
        customExtras.push({ label, price: extraPrice });
      }
    }
  } catch {
    /* ignore */
  }
  return { amenityExtraPrices, customExtras };
}

async function cheapestListedPriceInCategory(
  category: string
): Promise<number | null> {
  const row = await prisma.service.findFirst({
    where: {
      category,
      minPrice: { not: null, gt: 0 },
    },
    orderBy: { minPrice: "asc" },
    select: { minPrice: true },
  });
  return row?.minPrice ?? null;
}

export default async function AfterVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const venueId = Number(rawId);
  if (!Number.isFinite(venueId) || venueId <= 0) notFound();

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      id: true,
      name: true,
      city: true,
      customAmenitiesJson: true,
      eventTypes: true,
    },
  });
  if (!venue) notFound();

  const { amenityExtraPrices, customExtras } = parseVenueMoneyRows(
    venue.customAmenitiesJson
  );

  const savingsCandidates: {
    id: string;
    hallLabel: string;
    hallPrice: number;
    category: string;
  }[] = [];

  for (const key of Object.keys(amenityExtraPrices) as BuiltinAmenityKey[]) {
    const hallPrice = amenityExtraPrices[key];
    if (hallPrice == null || hallPrice <= 0) continue;
    const cat = providerCategoryForHallBuiltin(key);
    if (!cat) continue;
    savingsCandidates.push({
      id: `b-${key}`,
      hallLabel: HALL_BUILTIN_LABELS[key],
      hallPrice,
      category: cat,
    });
  }

  let customIdx = 0;
  for (const row of customExtras) {
    const cat = providerCategoryForCustomLabel(row.label);
    if (!cat) continue;
    savingsCandidates.push({
      id: `c-${customIdx++}`,
      hallLabel: row.label,
      hallPrice: row.price,
      category: cat,
    });
  }

  const byCategory = new Map<string, typeof savingsCandidates>();
  for (const c of savingsCandidates) {
    const list = byCategory.get(c.category) ?? [];
    list.push(c);
    byCategory.set(c.category, list);
  }

  const savingsOpportunities: SavingsOpportunityPayload[] = [];
  for (const [, list] of byCategory) {
    const categories = [...new Set(list.map((x) => x.category))];
    const marketByCat = new Map<string, number | null>();
    for (const cat of categories) {
      marketByCat.set(cat, await cheapestListedPriceInCategory(cat));
    }
    for (const item of list) {
      const marketFrom = marketByCat.get(item.category) ?? null;
      const cheaperThanHall =
        marketFrom != null && marketFrom > 0 && marketFrom < item.hallPrice;
      savingsOpportunities.push({
        id: item.id,
        hallLabel: item.hallLabel,
        hallPrice: item.hallPrice,
        category: item.category,
        marketFrom,
        cheaperThanHall,
      });
    }
  }

  let eventTypes: string[] = [];
  if (venue.eventTypes) {
    try {
      const p = JSON.parse(venue.eventTypes) as unknown;
      if (Array.isArray(p)) {
        eventTypes = p.filter(
          (x): x is string => typeof x === "string" && x.trim().length > 0
        );
      }
    } catch {
      eventTypes = [];
    }
  }

  const defaultEventType = eventTypes.includes("חתונה")
    ? "חתונה"
    : eventTypes[0] ?? "חתונה";

  return (
    <SitePageShell mainWidth="narrow" mainClassName="max-w-2xl">
      <AfterVenueGuideClient
        venueId={venue.id}
        venueName={venue.name}
        venueCity={venue.city}
        savingsOpportunities={savingsOpportunities}
        defaultEventType={defaultEventType}
        eventTypesOffered={eventTypes}
      />
    </SitePageShell>
  );
}
