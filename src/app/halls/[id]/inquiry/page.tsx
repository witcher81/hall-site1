import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
import { prisma } from "@/lib/prisma";
import { parseEventTypesList } from "@/lib/venueEditFormParse";
import { inferParkingKindFromDb } from "@/lib/venueParkingKind";
import type { VenueInquiryAmenitiesInput } from "@/lib/venueInquiryAmenities";
import { INQUIRY_EXTERNAL_SOURCE_COPY } from "@/lib/venueAmenitySeekerExternal";
import HomeHeader from "@/components/HomeHeader";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import VenueInquiryClient from "../VenueInquiryClient";

export const runtime = "nodejs";

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
      customAmenitiesJson: true,
      venueSoftAttributesJson: true,
      eventTypeProfilesJson: true,
      parkingKind: true,
      hasParkingNearby: true,
      parkingLatitude: true,
      parkingLongitude: true,
      seaView: true,
      boutique: true,
      accessible: true,
    },
  });

  if (!venue) {
    redirect("/halls");
  }

  const eventTypes = parseEventTypesList(venue.eventTypes);
  const venueAmenities: VenueInquiryAmenitiesInput = {
    hasChuppa: venue.hasChuppa,
    hasChuppaOutdoor: venue.hasChuppaOutdoor,
    hasChuppaCovered: venue.hasChuppaCovered,
    hasFood: venue.hasFood,
    hasDanceFloor: venue.hasDanceFloor,
    hasTableSetup: venue.hasTableSetup,
    hasSoundSystem: venue.hasSoundSystem,
    customAmenitiesJson: venue.customAmenitiesJson,
    venueSoftAttributesJson: venue.venueSoftAttributesJson,
    eventTypeProfilesJson: venue.eventTypeProfilesJson,
    eventTypes: venue.eventTypes,
  };

  const parkingKind = inferParkingKindFromDb({
    parkingKind: venue.parkingKind,
    hasParkingNearby: venue.hasParkingNearby,
    parkingLatitude: venue.parkingLatitude ?? null,
    parkingLongitude: venue.parkingLongitude ?? null,
  });

  const presetLabels: string[] = [];
  if (venue.seaView === true) presetLabels.push("נוף לים");
  if (venue.boutique === true) presetLabels.push("אירועי בוטיק");
  if (venue.accessible === true) presetLabels.push("נגישות לנכים");

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
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
          {INQUIRY_EXTERNAL_SOURCE_COPY.inquiryPageIntro} התמחור (כלול / בתוספת) מוצג לפי מה שהאולם
          הגדיר.
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
            parkingKind={parkingKind}
            presetLabels={presetLabels}
          />
        </Suspense>
      </main>
    </div>
  );
}
