import "server-only";

import { prisma } from "@/lib/prisma";
import { approvedListingWhere } from "@/lib/listingModerationTypes";
import { venuesToMapMarkers, type VenueMapMarker } from "@/lib/venueMapMarkers";

const MAP_MARKERS_CACHE_TTL_MS = 60_000;

let mapMarkersCache: { at: number; data: VenueMapMarker[] } | null = null;

/** כל האולמות המאושרים לסימוני מפה — עם מטמון קצר כי הרשימה כמעט לא משתנה בין חיפושים */
export async function getApprovedVenueMapMarkers(): Promise<VenueMapMarker[]> {
  const cached = mapMarkersCache;
  if (cached && Date.now() - cached.at < MAP_MARKERS_CACHE_TTL_MS) {
    return cached.data;
  }
  const mapVenueRows = await prisma.venue.findMany({
    where: approvedListingWhere(),
    select: {
      id: true,
      name: true,
      city: true,
      address: true,
      latitude: true,
      longitude: true,
    },
  });
  const data = venuesToMapMarkers(mapVenueRows);
  mapMarkersCache = { at: Date.now(), data };
  return data;
}
