import { googleMapsExplorerUrl } from "@/lib/googleStreetViewUrl";

export function wazeNavigationUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${encodeURIComponent(`${lat},${lng}`)}&navigate=yes`;
}

export function googleMapsAddressUrl(address: string, city?: string | null): string {
  const q = [address.trim(), city?.trim()].filter(Boolean).join(", ");
  return `https://www.google.com/maps?hl=iw&q=${encodeURIComponent(q)}`;
}

export function venuePrimaryMapsUrl(input: {
  latitude: number | null;
  longitude: number | null;
  address: string;
  city: string;
}): string {
  if (input.latitude != null && input.longitude != null) {
    return googleMapsExplorerUrl(input.latitude, input.longitude);
  }
  return googleMapsAddressUrl(input.address, input.city);
}

export function venueWazeUrl(input: {
  latitude: number | null;
  longitude: number | null;
}): string | null {
  if (input.latitude == null || input.longitude == null) return null;
  return wazeNavigationUrl(input.latitude, input.longitude);
}

export function parkingMapsUrl(input: {
  parkingLatitude: number | null;
  parkingLongitude: number | null;
}): string | null {
  if (input.parkingLatitude == null || input.parkingLongitude == null) return null;
  return googleMapsExplorerUrl(input.parkingLatitude, input.parkingLongitude);
}
