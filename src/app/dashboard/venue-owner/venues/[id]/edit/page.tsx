import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import VenueEditForm from "./VenueEditForm";

type PriceMode = "included" | "extra";
type BuiltinAmenityKey =
  | "hasFood"
  | "hasDanceFloor"
  | "hasTableSetup"
  | "hasSoundSystem"
  | "hasBridalRoom";

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

  const foodGalleryImageCount = await prisma.venueGalleryImage.count({
    where: { venueId: venue.id, category: "FOOD" },
  });
  const builtinAmenityPriceModes: Record<BuiltinAmenityKey, PriceMode> = {
    hasFood: "included",
    hasDanceFloor: "included",
    hasTableSetup: "included",
    hasSoundSystem: "included",
    hasBridalRoom: "included",
  };
  const builtinAmenityExtraPrices: Record<BuiltinAmenityKey, string> = {
    hasFood: "",
    hasDanceFloor: "",
    hasTableSetup: "",
    hasSoundSystem: "",
    hasBridalRoom: "",
  };
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
        hallRentalMin: venue.hallRentalMin ?? "",
        hallRentalMax: venue.hallRentalMax ?? "",
        description: venue.description ?? "",
        eventTypes: venue.eventTypes ? (JSON.parse(venue.eventTypes) as string[]) : [],
        hasChuppa: venue.hasChuppa,
        hasChuppaOutdoor: venue.hasChuppaOutdoor,
        hasChuppaCovered: venue.hasChuppaCovered,
        hasFood: venue.hasFood,
        hasDanceFloor: venue.hasDanceFloor,
        hasTableSetup: venue.hasTableSetup,
        hasSoundSystem: venue.hasSoundSystem,
        hasBridalRoom: venue.hasBridalRoom,
        coverImageUrl: venue.coverImageUrl ?? null,
        galleryImageUrls: galleryUrls,
        foodGalleryImageCount,
        customAmenitiesJson: venue.customAmenitiesJson ?? null,
        builtinAmenityPriceModes,
        builtinAmenityExtraPrices,
        eventTypeProfilesJson: venue.eventTypeProfilesJson ?? null,
      }}
    />
  );
}
