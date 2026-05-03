/** ערכי parkingKind ב-Venue (טופס בעלים + API) — ללא paid_lot נפרד (ממופה ל-nearby) */
export const PARKING_KINDS = ["none", "adjacent", "nearby"] as const;

export type ParkingKind = (typeof PARKING_KINDS)[number];

const KIND_SET = new Set<string>(PARKING_KINDS);

export function isValidParkingKind(s: string): s is ParkingKind {
  return KIND_SET.has(s);
}

/** ערך מהמסד או מטופס ישן — public_street / paid_lot מאוחדים ל־nearby */
export function coerceParkingKindFromStorage(
  s: string | null | undefined
): ParkingKind | null {
  const t = typeof s === "string" ? s.trim() : "";
  if (t === "public_street" || t === "paid_lot") return "nearby";
  if (isValidParkingKind(t)) return t;
  return null;
}

export function parkingKindNeedsMap(kind: ParkingKind | ""): boolean {
  return kind === "nearby";
}

export function parkingKindHasAnyParking(kind: ParkingKind | ""): boolean {
  return kind !== "" && kind !== "none";
}

/**
 * פרמטרי חיפוש: `parkingKind` (מומלץ) או `parking` ישן מהממשק הקודם.
 * מחזיר ערך לסינון ב־`Venue.parkingKind` או null כשלא לסנן.
 */
export function resolveParkingFilterFromSearchParams(
  parkingKindParam: string | null | undefined,
  legacyParkingParam: string | null | undefined
): ParkingKind | null {
  const pk = typeof parkingKindParam === "string" ? parkingKindParam.trim() : "";
  if (pk === "paid_lot") return "nearby";
  if (pk && isValidParkingKind(pk)) return pk;
  const leg = typeof legacyParkingParam === "string" ? legacyParkingParam.trim() : "";
  if (leg === "אין") return "none";
  if (leg === "חניה צמודה") return "adjacent";
  if (leg === "חניון") return "nearby";
  return null;
}

export const PARKING_KIND_LABELS: Record<ParkingKind, string> = {
  none: "אין / לא רלוונטי",
  adjacent: "חניה צמודה לאולם (ללא סימון במפה)",
  nearby: "חניה בקרבת מקום — יש לסמן במפה את מיקום החניה",
};

/** תוויות קצרות לחיפוש / סלקט */
export const PARKING_KIND_SHORT_LABELS: Record<ParkingKind, string> = {
  none: "ללא חניה / לא רלוונטי",
  adjacent: "חניה צמודה לאולם",
  nearby: "חניה בקרבת מקום",
};

function hasValidIsraelParkingCoords(
  lat: number | null,
  lng: number | null
): boolean {
  return (
    lat != null &&
    lng != null &&
    lat >= 29 &&
    lat <= 34 &&
    lng >= 33 &&
    lng <= 36
  );
}

/** טעינת אולם ישן לפני שדה parkingKind */
export function inferParkingKindFromDb(venue: {
  parkingKind: string | null;
  hasParkingNearby: boolean;
  parkingLatitude: number | null;
  parkingLongitude: number | null;
}): ParkingKind {
  const raw = venue.parkingKind?.trim();
  const coerced = raw ? coerceParkingKindFromStorage(raw) : null;
  if (coerced) return coerced;
  if (!venue.hasParkingNearby) return "none";
  if (hasValidIsraelParkingCoords(venue.parkingLatitude, venue.parkingLongitude)) {
    return "nearby";
  }
  return "adjacent";
}
