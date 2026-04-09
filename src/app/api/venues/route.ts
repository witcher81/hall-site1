import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
  const parking = searchParams.get("parking")?.trim();
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
  // אורחים: משתמש מזין מינימום ו/או מקסימום – רוצים אולם שמכיל *לפחות* את המספר המבוקש (venue.maxGuests >= הערך)
  const minG = minGuests && minGuests !== "" ? Number(minGuests) : NaN;
  const maxG = maxGuests && maxGuests !== "" ? Number(maxGuests) : NaN;
  const guestLimit = [minG, maxG].filter((n) => !Number.isNaN(n));
  if (guestLimit.length > 0 && !(eventType && eventType.length > 0)) {
    const required = Math.max(...guestLimit);
    where.maxGuests = { gte: required };
  }
  // תקציב משתמש: מינימום למנה – האולם מתאים אם המחיר המינימלי שלו למנה >= מה שהוזן
  if (minPrice && minPrice !== "" && !(eventType && eventType.length > 0)) {
    const n = Number(minPrice);
    if (!Number.isNaN(n)) where.minPrice = { gte: n };
  }
  // תקציב משתמש: מקסימום למנה – האולם מתאים אם המחיר המקסימלי שלו למנה <= מה שהוזן
  if (maxPrice && maxPrice !== "" && !(eventType && eventType.length > 0)) {
    const n = Number(maxPrice);
    if (!Number.isNaN(n)) where.maxPrice = { lte: n };
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
  if (parking && parking !== "") {
    where.parking = { equals: parking };
  }
  if (venueType && venueType !== "") {
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
    if (!Number.isNaN(minGuestsNum) && profile.maxGuests != null && profile.maxGuests < minGuestsNum) return false;
    if (!Number.isNaN(maxGuestsNum) && profile.maxGuests != null && profile.maxGuests < maxGuestsNum) return false;
    if (!Number.isNaN(minPriceNum) && profile.minPrice != null && profile.minPrice < minPriceNum) return false;
    if (!Number.isNaN(maxPriceNum) && profile.maxPrice != null && profile.maxPrice > maxPriceNum) return false;
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
