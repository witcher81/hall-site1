import { coordsForCity } from "@/lib/israel-city-coords";
import { jitterLatLng } from "@/lib/conversation-utils";

export type VenueMapMarkerInput = {
  id: number;
  name: string;
  city: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type VenueMapMarker = {
  id: number;
  name: string;
  city: string;
  address?: string;
  lat: number;
  lng: number;
  approximate: boolean;
};

export function venueToMapMarker(v: VenueMapMarkerInput): VenueMapMarker {
  const hasGeocoded =
    v.latitude != null &&
    v.longitude != null &&
    Number.isFinite(v.latitude) &&
    Number.isFinite(v.longitude);

  if (hasGeocoded) {
    return {
      id: v.id,
      name: v.name,
      city: v.city,
      address: v.address,
      lat: v.latitude as number,
      lng: v.longitude as number,
      approximate: false,
    };
  }

  const base = coordsForCity(v.city);
  const j = jitterLatLng(v.id, base);
  return {
    id: v.id,
    name: v.name,
    city: v.city,
    address: v.address,
    lat: j.lat,
    lng: j.lng,
    approximate: true,
  };
}

export function venuesToMapMarkers(venues: VenueMapMarkerInput[]): VenueMapMarker[] {
  return venues.map(venueToMapMarker);
}
