import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getVenueInquiryOptions,
  type VenueInquiryAmenitiesInput,
} from "@/lib/venueInquiryAmenities";

export const runtime = "nodejs";

async function assertVenueOwner(userId: number, venueId: number) {
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, ownerId: userId },
    select: { id: true },
  });
  return venue != null;
}

/** אפשרויות אולם לבחירה בחבילה (שירותים/תוספות) */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const venueId = Number(req.nextUrl.searchParams.get("venueId"));
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "חסר venueId" }, { status: 400 });
  }
  if (!(await assertVenueOwner(user.id, venueId))) {
    return NextResponse.json({ error: "אולם לא נמצא" }, { status: 404 });
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
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
    },
  });
  if (!venue) {
    return NextResponse.json({ error: "אולם לא נמצא" }, { status: 404 });
  }

  const amenities: VenueInquiryAmenitiesInput = {
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

  const options = getVenueInquiryOptions(amenities, undefined).services.map((o) => ({
    id: o.id,
    label: o.label,
    priceMode: o.priceMode,
    extraPrice: o.extraPrice,
    extraPriceMax: o.extraPriceMax ?? null,
  }));

  let eventTypes: string[] = [];
  try {
    eventTypes = venue.eventTypes ? (JSON.parse(venue.eventTypes) as string[]) : [];
  } catch {
    eventTypes = [];
  }

  return NextResponse.json({ options, eventTypes });
}
