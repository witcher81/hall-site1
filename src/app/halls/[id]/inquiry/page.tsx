import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseEventTypesList } from "@/lib/venueEditFormParse";
import { parseVenueEventTypeProfilesForPublic } from "@/lib/venueEventTypeProfilesPublic";
import { venueKashrutLabel } from "@/lib/venueKashrutOptions";
import { inferParkingKindFromDb } from "@/lib/venueParkingKind";
import type { VenueInquiryAmenitiesInput } from "@/lib/venueInquiryAmenities";
import { INQUIRY_EXTERNAL_SOURCE_COPY } from "@/lib/venueAmenitySeekerExternal";
import { VENUE_HALL_SOFT_PRESET_LABEL } from "@/lib/venueHallSoftPresets";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
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
      kashrut: true,
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
  const eventTypeProfiles = parseVenueEventTypeProfilesForPublic(
    venue.eventTypeProfilesJson,
    eventTypes
  );
  const kashrutLabel = venueKashrutLabel(venue.kashrut);

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
  if (venue.seaView === true) presetLabels.push(VENUE_HALL_SOFT_PRESET_LABEL.seaView);
  if (venue.boutique === true) presetLabels.push(VENUE_HALL_SOFT_PRESET_LABEL.boutique);
  if (venue.accessible === true) presetLabels.push(VENUE_HALL_SOFT_PRESET_LABEL.accessible);

  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        kicker="בקשה להצעת מחיר"
        title={venue.name}
        description={`${INQUIRY_EXTERNAL_SOURCE_COPY.inquiryPageIntro} בקשת הזמנה בשלבים: פרטי האירוע, מה האולם מציע, ושליחה לאישור.`}
      >
        <a
          href={`/halls/${venue.id}`}
          className="inline-block text-sm font-semibold text-emerald-950 underline-offset-4 hover:text-amber-700 hover:underline"
        >
          ← חזרה לדף האולם
        </a>
      </SitePageHeader>
      <Suspense
        fallback={
          <p className="mt-8 text-center text-sm text-neutral-600">טוען טופס...</p>
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
          kashrutLabel={kashrutLabel}
          eventTypeProfiles={eventTypeProfiles}
        />
      </Suspense>
    </SitePageShell>
  );
}
