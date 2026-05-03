import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveParkingFilterFromSearchParams } from "@/lib/venueParkingKind";
import { VENUE_TYPE_VALUE_SET } from "@/lib/venueTypeOptions";

/**
 * רשימת אולמות לציבור (מחפשים) – עם סינון אופציונלי
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim();
  const minGuests = searchParams.get("minGuests");
  const maxGuests = searchParams.get("maxGuests");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const hallRentalMin = searchParams.get("hallRentalMin");
  const hallRentalMax = searchParams.get("hallRentalMax");
  const eventType = searchParams.get("eventType")?.trim();
  const kashrut = searchParams.get("kashrut")?.trim();
  const parkingKindParam = searchParams.get("parkingKind")?.trim();
  const parkingLegacy = searchParams.get("parking")?.trim();
  const venueType = searchParams.get("venueType")?.trim();
  const seaView = searchParams.get("seaView");
  const boutique = searchParams.get("boutique");
  const accessible = searchParams.get("accessible");
  const hasChuppa = searchParams.get("hasChuppa");
  const hasFood = searchParams.get("hasFood");
  const hasTableSetup = searchParams.get("hasTableSetup");
  const hasDanceFloor = searchParams.get("hasDanceFloor");
  const hasSoundSystem = searchParams.get("hasSoundSystem");
  const hasBridalRoom = searchParams.get("hasBridalRoom");

  const where: Prisma.VenueWhereInput = {};

  // עיר: התאמה חלקית – למשל "גבעת" יתאים ל"גבעת שמואל"
  if (city && city.length > 0) {
    where.city = { contains: city };
  }
  const minG = minGuests && minGuests !== "" ? Number(minGuests) : NaN;
  const maxG = maxGuests && maxGuests !== "" ? Number(maxGuests) : NaN;
  const minP = minPrice && minPrice !== "" ? Number(minPrice) : NaN;
  const maxP = maxPrice && maxPrice !== "" ? Number(maxPrice) : NaN;

  const andParts: Prisma.VenueWhereInput[] = Array.isArray(where.AND)
    ? [...where.AND]
    : where.AND
      ? [where.AND]
      : [];

  // אורחים: מדויק (min=max), טווח, או שדה בודד — ללא סינון DB כשמסננים לפי פרופיל סוג אירוע
  if (!(eventType && eventType.length > 0)) {
    const hasMinG = !Number.isNaN(minG);
    const hasMaxG = !Number.isNaN(maxG);
    if (hasMinG || hasMaxG) {
      if (hasMinG && hasMaxG && minG === maxG) {
        const n = minG;
        where.maxGuests = { gte: n };
        andParts.push({
          OR: [{ minGuests: null }, { minGuests: { lte: n } }],
        });
      } else if (hasMinG && hasMaxG && minG !== maxG) {
        const lo = Math.min(minG, maxG);
        const hi = Math.max(minG, maxG);
        andParts.push({
          OR: [{ maxGuests: null }, { maxGuests: { gte: lo } }],
        });
        andParts.push({
          OR: [{ minGuests: null }, { minGuests: { lte: hi } }],
        });
      } else if (hasMinG) {
        where.maxGuests = { gte: minG };
      } else {
        where.maxGuests = { gte: maxG };
      }
    }

    const hasMinP = !Number.isNaN(minP);
    const hasMaxP = !Number.isNaN(maxP);
    if (hasMinP || hasMaxP) {
      if (hasMinP && hasMaxP && minP === maxP) {
        const n = minP;
        andParts.push({
          OR: [{ minPrice: null }, { minPrice: { lte: n } }],
        });
        andParts.push({
          OR: [{ maxPrice: null }, { maxPrice: { gte: n } }],
        });
      } else if (hasMinP && hasMaxP && minP !== maxP) {
        const lo = Math.min(minP, maxP);
        const hi = Math.max(minP, maxP);
        andParts.push({
          OR: [{ maxPrice: null }, { maxPrice: { gte: lo } }],
        });
        andParts.push({
          OR: [{ minPrice: null }, { minPrice: { lte: hi } }],
        });
      } else if (hasMinP) {
        where.minPrice = { gte: minP };
      } else {
        where.maxPrice = { lte: maxP };
      }
    }
  }

  if (andParts.length > 0) {
    where.AND = andParts;
  }
  if (hallRentalMin && hallRentalMin !== "") {
    const n = Number(hallRentalMin);
    if (!Number.isNaN(n)) where.hallRentalMin = { gte: n };
  }
  if (hallRentalMax && hallRentalMax !== "") {
    const n = Number(hallRentalMax);
    if (!Number.isNaN(n)) where.hallRentalMax = { lte: n };
  }
  if (eventType && eventType.length > 0) {
    where.eventTypes = { contains: eventType };
  }

  // כשרות / חניה / סוג מקום – התאמה ישירה לערך
  if (kashrut && kashrut !== "") {
    where.kashrut = { equals: kashrut };
  }
  const parkingKindFilter = resolveParkingFilterFromSearchParams(
    parkingKindParam,
    parkingLegacy
  );
  if (parkingKindFilter) {
    where.parkingKind = { equals: parkingKindFilter };
  }
  if (venueType && venueType !== "") {
    if (!VENUE_TYPE_VALUE_SET.has(venueType)) {
      return NextResponse.json(
        { error: "סוג מקום לא תקין", venues: [] },
        { status: 400 }
      );
    }
    where.venueType = { equals: venueType };
  }

  // שדות בוליאניים – מצפים לערך "true" מ־query string
  if (seaView === "true") {
    where.seaView = true;
  }
  if (boutique === "true") {
    where.boutique = true;
  }
  if (accessible === "true") {
    where.accessible = true;
  }
  if (hasChuppa === "true") where.hasChuppa = true;
  if (hasFood === "true") {
    where.OR = [
      { hasFood: true },
      { eventTypes: { contains: "חתונה" } },
    ];
  }
  if (hasTableSetup === "true") where.hasTableSetup = true;
  if (hasDanceFloor === "true") where.hasDanceFloor = true;
  if (hasSoundSystem === "true") where.hasSoundSystem = true;
  if (hasBridalRoom === "true") where.hasBridalRoom = true;

  const venues = await prisma.venue.findMany({
    where,
    select: {
      id: true,
      name: true,
      city: true,
      address: true,
      minGuests: true,
      maxGuests: true,
      minPrice: true,
      maxPrice: true,
      hallRentalMin: true,
      hallRentalMax: true,
      eventTypes: true,
      description: true,
      kashrut: true,
      parking: true,
      parkingKind: true,
      venueType: true,
      seaView: true,
      boutique: true,
      accessible: true,
      hasChuppa: true,
      hasFood: true,
      hasTableSetup: true,
      hasDanceFloor: true,
      hasSoundSystem: true,
      hasBridalRoom: true,
      customAmenitiesJson: true,
      eventTypeProfilesJson: true,
      coverImageUrl: true,
      galleryImageUrls: true,
      boostExpiresAt: true,
      createdAt: true,
    },
  });

  const minGuestsNum = minGuests && minGuests !== "" ? Number(minGuests) : NaN;
  const maxGuestsNum = maxGuests && maxGuests !== "" ? Number(maxGuests) : NaN;
  const minPriceNum = minPrice && minPrice !== "" ? Number(minPrice) : NaN;
  const maxPriceNum = maxPrice && maxPrice !== "" ? Number(maxPrice) : NaN;
  const activeEventType = eventType && eventType.length > 0 ? eventType : null;

  const filteredByEventProfile = venues.filter((v) => {
    if (!activeEventType) return true;
    const fallback = {
      minGuests: v.minGuests,
      maxGuests: v.maxGuests,
      minPrice: v.minPrice,
      maxPrice: v.maxPrice,
    };
    let profile = fallback;
    if (v.eventTypeProfilesJson) {
      try {
        const parsed = JSON.parse(v.eventTypeProfilesJson) as unknown;
        if (typeof parsed === "object" && parsed && !Array.isArray(parsed)) {
          const row = (parsed as Record<string, unknown>)[activeEventType];
          if (typeof row === "object" && row && !Array.isArray(row)) {
            const obj = row as Record<string, unknown>;
            profile = {
              minGuests:
                typeof obj.minGuests === "number" ? obj.minGuests : fallback.minGuests,
              maxGuests:
                typeof obj.maxGuests === "number" ? obj.maxGuests : fallback.maxGuests,
              minPrice:
                typeof obj.minPrice === "number" ? obj.minPrice : fallback.minPrice,
              maxPrice:
                typeof obj.maxPrice === "number" ? obj.maxPrice : fallback.maxPrice,
            };
          }
        }
      } catch {
        profile = fallback;
      }
    }
    const pMinG = profile.minGuests ?? 0;
    const pMaxG = profile.maxGuests ?? Number.POSITIVE_INFINITY;
    const hasUG =
      !Number.isNaN(minGuestsNum) || !Number.isNaN(maxGuestsNum);
    if (hasUG) {
      const uLo = Number.isNaN(minGuestsNum)
        ? Number.isNaN(maxGuestsNum)
          ? 0
          : maxGuestsNum
        : minGuestsNum;
      const uHi = Number.isNaN(maxGuestsNum)
        ? Number.isNaN(minGuestsNum)
          ? uLo
          : minGuestsNum
        : maxGuestsNum;
      const lo = Math.min(uLo, uHi);
      const hi = Math.max(uLo, uHi);
      if (pMaxG < lo || pMinG > hi) return false;
    }

    const pMinP = profile.minPrice ?? 0;
    const pMaxP = profile.maxPrice ?? Number.POSITIVE_INFINITY;
    const hasUP = !Number.isNaN(minPriceNum) || !Number.isNaN(maxPriceNum);
    if (hasUP) {
      const uLo = Number.isNaN(minPriceNum)
        ? Number.isNaN(maxPriceNum)
          ? 0
          : maxPriceNum
        : minPriceNum;
      const uHi = Number.isNaN(maxPriceNum)
        ? Number.isNaN(minPriceNum)
          ? uLo
          : minPriceNum
        : maxPriceNum;
      const lo = Math.min(uLo, uHi);
      const hi = Math.max(uLo, uHi);
      if (pMaxP < lo || pMinP > hi) return false;
    }
    return true;
  });

  const now = new Date();
  const sorted = [...filteredByEventProfile].sort((a, b) => {
    const ab = !!(a.boostExpiresAt && a.boostExpiresAt > now);
    const bb = !!(b.boostExpiresAt && b.boostExpiresAt > now);
    if (ab !== bb) return ab ? -1 : 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const list = sorted.map((v) => {
    const { boostExpiresAt, createdAt, customAmenitiesJson, eventTypeProfilesJson, ...rest } = v;
    const customAmenities: { label: string; checked: boolean; priceMode: "included" | "extra" }[] = [];
    if (customAmenitiesJson) {
      try {
        const parsed = JSON.parse(customAmenitiesJson) as unknown;
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (typeof item !== "object" || item === null) continue;
            const o = item as Record<string, unknown>;
            const label = typeof o.label === "string" ? o.label.trim() : "";
            if (!label) continue;
            if (label.startsWith("__builtin__:")) continue;
            customAmenities.push({
              label,
              checked: o.checked === true,
              priceMode: o.priceMode === "extra" ? "extra" : "included",
            });
          }
        }
      } catch {
        /* ignore */
      }
    }
    let eventTypeProfiles: Record<string, unknown> = {};
    if (eventTypeProfilesJson) {
      try {
        const parsedProfiles = JSON.parse(eventTypeProfilesJson) as unknown;
        if (typeof parsedProfiles === "object" && parsedProfiles && !Array.isArray(parsedProfiles)) {
          eventTypeProfiles = parsedProfiles as Record<string, unknown>;
        }
      } catch {
        eventTypeProfiles = {};
      }
    }
    return {
      ...rest,
      eventTypes: v.eventTypes ? (JSON.parse(v.eventTypes) as string[]) : [],
      galleryImageUrls: v.galleryImageUrls
        ? (JSON.parse(v.galleryImageUrls) as string[])
        : [],
      customAmenities,
      eventTypeProfiles,
      isBoosted: !!(boostExpiresAt && boostExpiresAt > now),
    };
  });

  return NextResponse.json({ venues: list });
}
