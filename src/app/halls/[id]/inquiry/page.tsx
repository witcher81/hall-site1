import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HomeHeader from "@/components/HomeHeader";
import type { VenueInquiryAmenitiesInput } from "@/lib/venueInquiryAmenities";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import VenueInquiryClient from "../VenueInquiryClient";

export const runtime = "nodejs";

function parseEventTypes(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim());
  } catch {
    return [];
  }
}

export default async function VenueInquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venueId = Number(id);
  const user = await getCurrentUser();

  if (!Number.isInteger(venueId) || venueId <= 0) {
    redirect("/halls");
  }
  if (!user) {
    redirect(`/auth/login?redirect=${encodeURIComponent(`/halls/${venueId}/inquiry`)}`);
  }
  if (user.role !== "SEEKER") {
    redirect(`/halls/${venueId}`);
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      id: true,
      name: true,
      minGuests: true,
      maxGuests: true,
      eventTypes: true,
      hasChuppa: true,
      hasChuppaOutdoor: true,
      hasChuppaCovered: true,
      hasFood: true,
      hasDanceFloor: true,
      hasTableSetup: true,
      hasSoundSystem: true,
      hasBridalRoom: true,
      customAmenitiesJson: true,
    },
  });

  if (!venue) {
    redirect("/halls");
  }

  const eventTypes = parseEventTypes(venue.eventTypes);
  const venueAmenities: VenueInquiryAmenitiesInput = {
    hasChuppa: venue.hasChuppa,
    hasChuppaOutdoor: venue.hasChuppaOutdoor,
    hasChuppaCovered: venue.hasChuppaCovered,
    hasFood: venue.hasFood,
    hasDanceFloor: venue.hasDanceFloor,
    hasTableSetup: venue.hasTableSetup,
    hasSoundSystem: venue.hasSoundSystem,
    hasBridalRoom: venue.hasBridalRoom,
    customAmenitiesJson: venue.customAmenitiesJson,
  };

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-right text-xs text-[#6B6560]">
          <a href={`/halls/${venue.id}`} className="font-medium text-[#0F3B2E] hover:underline">
            ← חזרה לדף האולם
          </a>
        </p>
        <h1 className="mt-2 text-right text-xl font-semibold text-[#1A1A1A]">
          בקשה להצעת מחיר — {venue.name}
        </h1>
        <p className="mt-1 text-right text-sm text-[#5F5F5F]">
          בוחרים תאריך בלוח או בשדה, מציינים אורחים, ולכל שירות שהאולם מציע בוחרים אם לסגור דרך האולם או עם ספק
          חיצוני. אפשר לשלוח כמה פניות לאותו אולם (למשל תאריכים שונים או עדכון פרטים).
        </p>
        <Suspense
          fallback={
            <p className="mt-8 text-center text-sm text-[#6B6560]">טוען טופס...</p>
          }
        >
          <VenueInquiryClient
            venueId={venue.id}
            venueName={venue.name}
            minGuests={venue.minGuests}
            maxGuests={venue.maxGuests}
            eventTypes={eventTypes}
            venueAmenities={venueAmenities}
          />
        </Suspense>
      </main>
    </div>
  );
}
