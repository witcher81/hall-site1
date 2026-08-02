import "server-only";

import type { Prisma } from "@prisma/client";
import {
  getEventPackageRecipe,
  type PackageServiceSlot,
} from "@/lib/eventPackageRecipes";
import { eventTypeSearchContainsVariants } from "@/lib/eventTypeOptions";
import { approvedListingWhere } from "@/lib/listingModerationTypes";
import { prisma } from "@/lib/prisma";
import { buildServiceCategoryWhere } from "@/lib/serviceCategoryQuery";
import { USER_INPUT_MAX } from "@/lib/userInputValidation";

export type SuggestPackagesInput = {
  eventType: string;
  area: string;
  guestCount?: number | null;
};

export type SuggestedPackageItem = {
  key: string;
  label: string;
  kind: "venue" | "service";
  id: number | null;
  name: string;
  href: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  missing: boolean;
  note?: string;
};

export type SuggestedPackage = {
  id: string;
  title: string;
  subtitle: string;
  eventType: string;
  venueId: number | null;
  venueName: string | null;
  venueCity: string | null;
  items: SuggestedPackageItem[];
  priceFrom: number | null;
  priceTo: number | null;
  completeness: number;
};

function priceRange(
  items: SuggestedPackageItem[]
): { from: number | null; to: number | null } {
  let from = 0;
  let to = 0;
  let any = false;
  for (const it of items) {
    if (it.missing) continue;
    if (it.priceFrom != null && it.priceFrom > 0) {
      from += it.priceFrom;
      to += it.priceTo != null && it.priceTo > it.priceFrom ? it.priceTo : it.priceFrom;
      any = true;
    }
  }
  return any ? { from, to } : { from: null, to: null };
}

function areaMatchClause(area: string): Prisma.ServiceWhereInput | undefined {
  const a = area.trim();
  if (!a) return undefined;
  return {
    OR: [
      { serviceArea: { contains: a, mode: "insensitive" } },
      { serviceArea: null },
      { serviceArea: "" },
    ],
  };
}

async function pickServiceForSlot(
  slot: PackageServiceSlot,
  area: string,
  usedIds: Set<number>
): Promise<{
  id: number;
  name: string;
  minPrice: number | null;
  maxPrice: number | null;
} | null> {
  const secondaries = [
    slot.secondary,
    ...(slot.secondaryFallbacks ?? []),
  ].filter((s): s is string => Boolean(s?.trim()));

  const tryQuery = async (secondary?: string) => {
    const catWhere = buildServiceCategoryWhere(slot.category, secondary ?? "");
    const areaClause = areaMatchClause(area);
    const where: Prisma.ServiceWhereInput = {
      ...approvedListingWhere(),
      ...catWhere,
      id: usedIds.size > 0 ? { notIn: [...usedIds] } : undefined,
      ...(areaClause ? { AND: [areaClause] } : {}),
    };
    return prisma.service.findMany({
      where,
      take: 8,
      orderBy: [{ minPrice: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        minPrice: true,
        maxPrice: true,
        category: true,
        serviceArea: true,
      },
    });
  };

  let rows =
    secondaries.length > 0
      ? await tryQuery(secondaries[0])
      : await tryQuery(undefined);

  if (rows.length === 0 && secondaries.length > 1) {
    for (const sec of secondaries.slice(1)) {
      rows = await tryQuery(sec);
      if (rows.length > 0) break;
    }
  }

  if (rows.length === 0) {
    rows = await tryQuery(undefined);
  }

  // העדפת אזור מדויק אם יש
  const a = area.trim().toLowerCase();
  if (a) {
    const local = rows.filter((r) =>
      (r.serviceArea ?? "").toLowerCase().includes(a)
    );
    if (local.length > 0) rows = local;
  }

  const pick = rows[0];
  if (!pick) return null;
  usedIds.add(pick.id);
  return pick;
}

async function findCandidateVenues(input: SuggestPackagesInput) {
  const area = input.area.trim().slice(0, USER_INPUT_MAX.CITY);
  const eventType = input.eventType.trim();
  const guests = input.guestCount ?? null;
  const variants = eventTypeSearchContainsVariants(eventType);

  const andParts: Prisma.VenueWhereInput[] = [
    approvedListingWhere(),
  ];

  if (area) {
    andParts.push({
      OR: [
        { city: { contains: area, mode: "insensitive" } },
        { address: { contains: area, mode: "insensitive" } },
        { name: { contains: area, mode: "insensitive" } },
      ],
    });
  }

  if (variants.length === 1) {
    andParts.push({ eventTypes: { contains: variants[0] } });
  } else if (variants.length > 1) {
    andParts.push({
      OR: variants.map((v) => ({ eventTypes: { contains: v } })),
    });
  }

  if (guests != null && Number.isFinite(guests) && guests > 0) {
    andParts.push({
      AND: [
        { OR: [{ minGuests: null }, { minGuests: { lte: guests } }] },
        { OR: [{ maxGuests: null }, { maxGuests: { gte: guests } }] },
      ],
    });
  }

  let venues = await prisma.venue.findMany({
    where: { AND: andParts },
    take: 12,
    orderBy: [{ hallRentalMin: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      city: true,
      hallRentalMin: true,
      hallRentalMax: true,
      minPrice: true,
      maxPrice: true,
      maxGuests: true,
      minGuests: true,
    },
  });

  // אם אין התאמה מדויקת לסוג אירוע — נרחיב בלי פילטר eventTypes
  if (venues.length === 0 && variants.length > 0) {
    const loose: Prisma.VenueWhereInput[] = [approvedListingWhere()];
    if (area) {
      loose.push({
        OR: [
          { city: { contains: area, mode: "insensitive" } },
          { address: { contains: area, mode: "insensitive" } },
        ],
      });
    }
    if (guests != null && guests > 0) {
      loose.push({
        OR: [{ maxGuests: null }, { maxGuests: { gte: guests } }],
      });
    }
    venues = await prisma.venue.findMany({
      where: { AND: loose },
      take: 12,
      orderBy: [{ hallRentalMin: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        city: true,
        hallRentalMin: true,
        hallRentalMax: true,
        minPrice: true,
        maxPrice: true,
        maxGuests: true,
        minGuests: true,
      },
    });
  }

  return venues;
}

export async function buildSuggestedPackages(
  input: SuggestPackagesInput
): Promise<{ packages: SuggestedPackage[]; recipeHeadline: string; recipeBlurb: string }> {
  const eventType = input.eventType.trim().slice(0, USER_INPUT_MAX.EVENT_TYPE_FREE);
  const area = input.area.trim().slice(0, USER_INPUT_MAX.CITY);
  const recipe = getEventPackageRecipe(eventType);
  const venues = await findCandidateVenues({
    eventType,
    area,
    guestCount: input.guestCount,
  });

  const venueSlotsNeeded = recipe.slots.filter((s) => s.kind === "venue").length > 0;
  const topVenues = venues.slice(0, 3);

  // אם אין אולמות — עדיין ננסה חבילת ספקים בלבד
  const packageBases =
    topVenues.length > 0
      ? topVenues
      : venueSlotsNeeded
        ? [null]
        : [null];

  const packages: SuggestedPackage[] = [];

  for (let i = 0; i < packageBases.length; i++) {
    const venue = packageBases[i];
    const usedServiceIds = new Set<number>();
    const items: SuggestedPackageItem[] = [];

    for (const slot of recipe.slots) {
      if (slot.kind === "venue") {
        if (!venue) {
          items.push({
            key: slot.key,
            label: slot.label,
            kind: "venue",
            id: null,
            name: "לא נמצא אולם מתאים באזור",
            href: `/halls?eventType=${encodeURIComponent(eventType)}${area ? `&city=${encodeURIComponent(area)}` : ""}`,
            priceFrom: null,
            priceTo: null,
            missing: true,
            note: "נסו אזור אחר או הרחיבו חיפוש",
          });
          continue;
        }
        const lo = venue.hallRentalMin ?? venue.minPrice;
        const hi = venue.hallRentalMax ?? venue.maxPrice ?? lo;
        items.push({
          key: slot.key,
          label: slot.label,
          kind: "venue",
          id: venue.id,
          name: venue.name,
          href: `/halls/${venue.id}`,
          priceFrom: lo,
          priceTo: hi != null && lo != null && hi > lo ? hi : lo,
          missing: false,
          note: venue.city,
        });
        continue;
      }

      const picked = await pickServiceForSlot(slot, area, usedServiceIds);
      if (!picked) {
        items.push({
          key: slot.key,
          label: slot.label,
          kind: "service",
          id: null,
          name: `לא נמצא עדיין: ${slot.label}`,
          href: `/providers?category=${encodeURIComponent(slot.category)}${
            slot.secondary
              ? `&secondary=${encodeURIComponent(slot.secondary)}`
              : ""
          }`,
          priceFrom: null,
          priceTo: null,
          missing: true,
          note: slot.required ? "מומלץ להשלים" : "אופציונלי",
        });
        continue;
      }

      items.push({
        key: slot.key,
        label: slot.label,
        kind: "service",
        id: picked.id,
        name: picked.name,
        href: `/services/${picked.id}`,
        priceFrom: picked.minPrice,
        priceTo:
          picked.maxPrice != null &&
          picked.minPrice != null &&
          picked.maxPrice > picked.minPrice
            ? picked.maxPrice
            : picked.minPrice,
        missing: false,
      });
    }

    const filled = items.filter((it) => !it.missing).length;
    const { from, to } = priceRange(items);
    const venueName = venue?.name ?? null;
    const title =
      packageBases.length > 1 && venueName
        ? `${recipe.headline} · ${venueName}`
        : recipe.headline;

    packages.push({
      id: `suggest-${i}-${venue?.id ?? "none"}`,
      title,
      subtitle: recipe.blurb,
      eventType: recipe.eventType,
      venueId: venue?.id ?? null,
      venueName,
      venueCity: venue?.city ?? null,
      items,
      priceFrom: from,
      priceTo: to,
      completeness: items.length === 0 ? 0 : filled / items.length,
    });
  }

  // מיון: שלמות גבוהה קודם, אחר כך מחיר
  packages.sort((a, b) => {
    if (b.completeness !== a.completeness) return b.completeness - a.completeness;
    return (a.priceFrom ?? 1e12) - (b.priceFrom ?? 1e12);
  });

  return {
    packages: packages.slice(0, 3),
    recipeHeadline: recipe.headline,
    recipeBlurb: recipe.blurb,
  };
}
