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

/**
 * מפת Google במצב «סייר» — נקודה עם פאנל צד, מסלולים וכו׳ (כמו לחיצה על קואורדינטות במפה).
 * לא משתמש ב־/maps/search/?api=1 כי לעיתים נפתחת תצוגת חיפוש צרה יותר.
 */
export function googleMapsExplorerUrl(lat: number, lng: number): string {
  const q = `${lat},${lng}`;
  return `https://www.google.com/maps?hl=iw&q=${encodeURIComponent(q)}`;
}

/** @deprecated שם ישן — זהה ל־googleMapsExplorerUrl */
export const googleMapsOpenPinUrl = googleMapsExplorerUrl;
