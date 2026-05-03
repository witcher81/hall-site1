import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  type BuiltinAmenityKeyFull,
  VENUE_PRODUCT_BUILTIN_KEYS,
} from "@/components/HallGeneralAmenitiesDnd";
import { inferParkingKindFromDb } from "@/lib/venueParkingKind";
import { resolveVenueTypeInitial } from "@/lib/venueTypeOptions";
import VenueEditForm from "./VenueEditForm";

function parseEventTypesList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  } catch {
    return [];
  }
}

function anyEventOffersFoodFromStored(
  eventTypes: string[],
  profilesJson: string | null
): boolean {
  if (eventTypes.includes("חתונה")) return true;
  if (!profilesJson) return false;
  try {
    const o = JSON.parse(profilesJson) as Record<
      string,
      { hasFoodAtEvent?: boolean }
    >;
    return eventTypes.some(
      (et) => et !== "חתונה" && o[et]?.hasFoodAtEvent === true
    );
  } catch {
    return false;
  }
}

type PriceMode = "included" | "extra";
type BuiltinAmenityKey = BuiltinAmenityKeyFull;

export default async function VenueEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-[#2A261F]">
            כדי לערוך אולם יש להתחבר כבעל/ת אולם.
          </p>
          <a
            href="/auth/login"
            className="mt-4 inline-block text-sm font-semibold text-[#0F3B2E] underline-offset-4 hover:underline"
          >
            התחברות
          </a>
        </main>
      </div>
    );
  }

  const venueId = Number(id);
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-[#2A261F]">מזהה אולם לא תקין.</p>
          <a
            href="/dashboard/venue-owner"
            className="mt-4 inline-block text-sm font-semibold text-[#0F3B2E] underline-offset-4 hover:underline"
          >
            חזרה לאולמות שלי
          </a>
        </main>
      </div>
    );
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
  });

  if (!venue || venue.ownerId !== user.id) {
    return (
      <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-[#2A261F]">
            לא נמצא אולם עם מזהה זה השייך לחשבון שלך.
          </p>
          <a
            href="/dashboard/venue-owner"
            className="mt-4 inline-block text-sm font-semibold text-[#0F3B2E] underline-offset-4 hover:underline"
          >
            חזרה לאולמות שלי
          </a>
        </main>
      </div>
    );
  }

  const galleryUrls = venue.galleryImageUrls
    ? (JSON.parse(venue.galleryImageUrls) as string[])
    : [];

  const eventTypesArr = parseEventTypesList(venue.eventTypes);
  const anyEvFood = anyEventOffersFoodFromStored(
    eventTypesArr,
    venue.eventTypeProfilesJson
  );
  const initialProductHasFood = venue.hasFood && !anyEvFood;
  const weddingInTypes = eventTypesArr.includes("חתונה");
  const initialProductHasChuppa =
    !weddingInTypes &&
    venue.hasChuppa &&
    !venue.hasChuppaOutdoor &&
    !venue.hasChuppaCovered;

  const foodGalleryImageCount = await prisma.venueGalleryImage.count({
    where: { venueId: venue.id, category: "FOOD" },
  });
  const builtinAmenityPriceModes = Object.fromEntries(
    VENUE_PRODUCT_BUILTIN_KEYS.map((k) => [k, "included" as PriceMode])
  ) as Record<BuiltinAmenityKey, PriceMode>;
  const builtinAmenityExtraPrices = Object.fromEntries(
    VENUE_PRODUCT_BUILTIN_KEYS.map((k) => [k, ""])
  ) as Record<BuiltinAmenityKey, string>;
  if (venue.customAmenitiesJson) {
    try {
      const parsed = JSON.parse(venue.customAmenitiesJson) as unknown;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item !== "object" || item === null) continue;
          const o = item as Record<string, unknown>;
          const label = typeof o.label === "string" ? o.label.trim() : "";
          if (!label.startsWith("__builtin__:")) continue;
          const key = label.slice("__builtin__:".length) as BuiltinAmenityKey;
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
      // ignore parse errors and keep defaults
    }
  }

  return (
    <VenueEditForm
      venueId={venue.id}
      initial={{
        name: venue.name,
        city: venue.city,
        address: venue.address,
        minGuests: venue.minGuests ?? "",
        maxGuests: venue.maxGuests ?? "",
        minPrice: venue.minPrice ?? "",
        maxPrice: venue.maxPrice ?? "",
        description: venue.description ?? "",
        eventTypes: venue.eventTypes ? (JSON.parse(venue.eventTypes) as string[]) : [],
        hasChuppaOutdoor: venue.hasChuppaOutdoor,
        hasChuppaCovered: venue.hasChuppaCovered,
        productHasChuppa: initialProductHasChuppa,
        productHasFood: initialProductHasFood,
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
        galleryImageUrls: galleryUrls,
        foodGalleryImageCount,
        customAmenitiesJson: venue.customAmenitiesJson ?? null,
        builtinAmenityPriceModes,
        builtinAmenityExtraPrices,
        eventTypeProfilesJson: venue.eventTypeProfilesJson ?? null,
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
      }}
    />
  );
}
