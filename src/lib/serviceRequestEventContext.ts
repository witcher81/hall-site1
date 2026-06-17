import {
  googleMapsAddressUrl,
  parkingMapsUrl,
  venuePrimaryMapsUrl,
  venueWazeUrl,
} from "@/lib/venueDirections";
import {
  coerceParkingKindFromStorage,
  inferParkingKindFromDb,
  PARKING_KIND_SHORT_LABELS,
} from "@/lib/venueParkingKind";

export type ServiceRequestEventContext = {
  eventType: string | null;
  preferredDate: string | null;
  guestCount: number | null;
  venue: {
    id: number;
    name: string;
    city: string;
    address: string;
    parkingLabel: string;
    accessible: boolean;
    mapsUrl: string;
    wazeUrl: string | null;
    parkingMapsUrl: string | null;
  };
};

/** שדות inquiry לטעינת הקשר אירוע לספק */
export const inquiryEventContextSelect = {
  id: true,
  status: true,
  eventType: true,
  preferredDate: true,
  guestCount: true,
  venue: {
    select: {
      id: true,
      name: true,
      city: true,
      address: true,
      latitude: true,
      longitude: true,
      parking: true,
      parkingKind: true,
      hasParkingNearby: true,
      parkingLatitude: true,
      parkingLongitude: true,
      accessible: true,
    },
  },
} as const;

type InquiryForEventContext = {
  eventType: string | null;
  preferredDate: string | null;
  guestCount: number | null;
  venue: {
    id: number;
    name: string;
    city: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    parking: string | null;
    parkingKind: string | null;
    hasParkingNearby: boolean;
    parkingLatitude: number | null;
    parkingLongitude: number | null;
    accessible: boolean | null;
  };
};

function parkingLabelForVenue(venue: InquiryForEventContext["venue"]): string {
  const kind = inferParkingKindFromDb(venue);
  if (kind !== "none") return PARKING_KIND_SHORT_LABELS[kind];
  const legacy = venue.parking?.trim();
  if (legacy && legacy !== "אין") return legacy;
  const coerced = venue.parkingKind
    ? coerceParkingKindFromStorage(venue.parkingKind)
    : null;
  if (coerced && coerced !== "none") return PARKING_KIND_SHORT_LABELS[coerced];
  return "לא צוין";
}

export function buildServiceRequestEventContext(
  inquiry: InquiryForEventContext | null | undefined
): ServiceRequestEventContext | null {
  if (!inquiry?.venue) return null;

  const venue = inquiry.venue;
  const kind = inferParkingKindFromDb(venue);

  return {
    eventType: inquiry.eventType,
    preferredDate: inquiry.preferredDate,
    guestCount: inquiry.guestCount,
    venue: {
      id: venue.id,
      name: venue.name,
      city: venue.city,
      address: venue.address,
      parkingLabel: parkingLabelForVenue(venue),
      accessible: venue.accessible === true,
      mapsUrl: venuePrimaryMapsUrl(venue),
      wazeUrl: venueWazeUrl(venue),
      parkingMapsUrl:
        kind === "nearby"
          ? parkingMapsUrl(venue) ?? googleMapsAddressUrl(venue.address, venue.city)
          : null,
    },
  };
}
