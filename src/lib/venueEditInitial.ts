import type { Venue } from "@prisma/client";
import {
  type BuiltinAmenityKeyFull,
  type HallGeneralPriceMode,
  VENUE_PRODUCT_BUILTIN_KEYS,
} from "@/lib/venueBuiltinAmenities";
import { inferParkingKindFromDb, type ParkingKind } from "@/lib/venueParkingKind";
import { resolveVenueTypeInitial } from "@/lib/venueTypeOptions";
import {
  buildEventTypeProfilesForEdit,
  parseEventTypesList,
  parseGalleryImageUrlsList,
  splitWeddingAmenities,
  parseCustomAmenitiesFromDb,
  type VenueEditEventTypeProfile,
} from "@/lib/venueEditFormParse";
import { parseVenueSoftAttributesFromDb } from "@/lib/venueSoftAttributesJson";
import type { VenueSoftAttributeRow } from "@/lib/venueSoftAttributesJson";

export type VenueEditFormInitial = {
  name: string;
  city: string;
  address: string;
  minGuests: string | number;
  maxGuests: string | number;
  minPrice: string | number;
  maxPrice: string | number;
  description: string;
  hasChuppaOutdoor: boolean;
  hasChuppaCovered: boolean;
  productHasChuppa: boolean;
  productHasFood: boolean;
  seaView: boolean;
  boutique: boolean;
  accessible: boolean;
  hasBridalRoom: boolean;
  hasDanceFloor: boolean;
  hasTableSetup: boolean;
  hasSoundSystem: boolean;
  hasVeganFood: boolean;
  foodKashrut: string;
  eventTypes: string[];
  eventTypeProfiles: Record<string, VenueEditEventTypeProfile>;
  coverImageUrl: string | null;
  galleryImageUrls: string[];
  foodGalleryImageCount: number;
  customAmenitiesJson: string | null;
  builtinAmenityPriceModes: Record<BuiltinAmenityKeyFull, HallGeneralPriceMode>;
  builtinAmenityExtraPrices: Record<BuiltinAmenityKeyFull, string>;
  latitude: number | null;
  longitude: number | null;
  parkingKind: ParkingKind;
  parkingLatitude: number | null;
  parkingLongitude: number | null;
  venueType: string;
  softAttributeRows: VenueSoftAttributeRow[];
};

function anyEventOffersFoodFromStored(
  eventTypes: string[],
  profilesJson: string | null
): boolean {
  if (eventTypes.includes("חתונה")) return true;
  if (!profilesJson) return false;
  try {
    const o = JSON.parse(profilesJson) as Record<string, { hasFoodAtEvent?: boolean }>;
    return eventTypes.some(
      (et) => et !== "חתונה" && o[et]?.hasFoodAtEvent === true
    );
  } catch {
    return false;
  }
}

export function buildVenueEditInitial(
  venue: Venue,
  foodGalleryImageCount: number
): VenueEditFormInitial {
  const eventTypes = parseEventTypesList(venue.eventTypes);
  const anyEvFood = anyEventOffersFoodFromStored(
    eventTypes,
    venue.eventTypeProfilesJson
  );
  const weddingInTypes = eventTypes.includes("חתונה");
  const initialProductHasChuppa =
    !weddingInTypes &&
    venue.hasChuppa &&
    !venue.hasChuppaOutdoor &&
    !venue.hasChuppaCovered;

  const builtinAmenityPriceModes = Object.fromEntries(
    VENUE_PRODUCT_BUILTIN_KEYS.map((k) => [k, "included" as HallGeneralPriceMode])
  ) as Record<BuiltinAmenityKeyFull, HallGeneralPriceMode>;
  const builtinAmenityExtraPrices = Object.fromEntries(
    VENUE_PRODUCT_BUILTIN_KEYS.map((k) => [k, ""])
  ) as Record<BuiltinAmenityKeyFull, string>;

  if (venue.customAmenitiesJson) {
    try {
      const parsed = JSON.parse(venue.customAmenitiesJson) as unknown;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item !== "object" || item === null) continue;
          const o = item as Record<string, unknown>;
          const label = typeof o.label === "string" ? o.label.trim() : "";
          if (!label.startsWith("__builtin__:")) continue;
          const key = label.slice("__builtin__:".length) as BuiltinAmenityKeyFull;
          if (!(key in builtinAmenityPriceModes)) continue;
          builtinAmenityPriceModes[key] =
            o.priceMode === "extra" ? "extra" : "included";
          if (o.priceMode === "extra") {
            const n =
              typeof o.extraPrice === "number"
                ? o.extraPrice
                : typeof o.extraPrice === "string"
                  ? Number(o.extraPrice)
                  : NaN;
            if (Number.isFinite(n) && n > 0) {
              builtinAmenityExtraPrices[key] = String(Math.trunc(n));
            }
          }
        }
      }
    } catch {
      // keep defaults
    }
  }

  const eventTypeProfiles = buildEventTypeProfilesForEdit(
    venue.eventTypeProfilesJson,
    eventTypes,
    venue.hasVeganFood ?? false,
    venue.customAmenitiesJson
  );

  return {
    name: String(venue.name ?? ""),
    city: String(venue.city ?? ""),
    address: String(venue.address ?? ""),
    minGuests: venue.minGuests ?? "",
    maxGuests: venue.maxGuests ?? "",
    minPrice: venue.minPrice ?? "",
    maxPrice: venue.maxPrice ?? "",
    description: venue.description ?? "",
    eventTypes,
    eventTypeProfiles,
    hasChuppaOutdoor: venue.hasChuppaOutdoor,
    hasChuppaCovered: venue.hasChuppaCovered,
    productHasChuppa: initialProductHasChuppa,
    productHasFood: venue.hasFood && !anyEvFood,
    seaView: venue.seaView === true,
    boutique: venue.boutique === true,
    accessible: venue.accessible === true,
    hasBridalRoom: venue.hasBridalRoom,
    hasDanceFloor: venue.hasDanceFloor,
    hasTableSetup: venue.hasTableSetup,
    hasSoundSystem: venue.hasSoundSystem,
    hasVeganFood: venue.hasVeganFood ?? false,
    foodKashrut: venue.kashrut ?? "",
    coverImageUrl: venue.coverImageUrl ?? null,
    galleryImageUrls: parseGalleryImageUrlsList(venue.galleryImageUrls),
    foodGalleryImageCount,
    customAmenitiesJson: venue.customAmenitiesJson ?? null,
    builtinAmenityPriceModes,
    builtinAmenityExtraPrices,
    latitude: venue.latitude ?? null,
    longitude: venue.longitude ?? null,
    parkingKind: inferParkingKindFromDb({
      parkingKind: venue.parkingKind,
      hasParkingNearby: venue.hasParkingNearby,
      parkingLatitude: venue.parkingLatitude ?? null,
      parkingLongitude: venue.parkingLongitude ?? null,
    }),
    parkingLatitude: venue.parkingLatitude ?? null,
    parkingLongitude: venue.parkingLongitude ?? null,
    venueType: resolveVenueTypeInitial(venue.venueType),
    softAttributeRows: parseVenueSoftAttributesFromDb(venue.venueSoftAttributesJson),
  };
}

/** שורות תמחור מותאמות כלליות (ללא builtin / חתונה) — לטופס */
export function buildInitialCustomHallGeneralRows(
  customAmenitiesJson: string | null | undefined
) {
  return splitWeddingAmenities(parseCustomAmenitiesFromDb(customAmenitiesJson)).general;
}
