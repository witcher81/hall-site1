/**
 * פותח את Google Street View בנקודה נתונה (חיצים וניווט ברחוב — באתר של Google).
 * לא דורש מפתח API; נפתח בלשונית חדשה.
 */
export function googleStreetViewOpenUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    api: "1",
    map_action: "pano",
    viewpoint: `${lat},${lng}`,
  });
  return `https://www.google.com/maps/@?${params.toString()}`;
}

/** פתיחת נקודה (סיכת חניה וכו׳) ב-Google Maps בלשונית חדשה. */
export function googleMapsOpenPinUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    api: "1",
    query: `${lat},${lng}`,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}
