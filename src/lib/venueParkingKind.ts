/** ערכי parkingKind ב-Venue (טופס בעלים + API) */
export const PARKING_KINDS = [
  "none",
  "adjacent",
  "nearby",
  "paid_lot",
] as const;

export type ParkingKind = (typeof PARKING_KINDS)[number];

const KIND_SET = new Set<string>(PARKING_KINDS);

export function isValidParkingKind(s: string): s is ParkingKind {
  return KIND_SET.has(s);
}

/** ערך מהמסד או מטופס ישן — public_street אוחד ל־nearby */
export function coerceParkingKindFromStorage(
  s: string | null | undefined
): ParkingKind | null {
  const t = typeof s === "string" ? s.trim() : "";
  if (t === "public_street") return "nearby";
  if (isValidParkingKind(t)) return t;
  return null;
}

export function parkingKindNeedsMap(kind: ParkingKind | ""): boolean {
  return kind === "nearby" || kind === "paid_lot";
}

export function parkingKindHasAnyParking(kind: ParkingKind | ""): boolean {
  return kind !== "" && kind !== "none";
}

export const PARKING_KIND_LABELS: Record<ParkingKind, string> = {
  none: "אין / לא רלוונטי",
  adjacent: "חניה צמודה לאולם (ללא סימון במפה)",
  nearby: "חניה בקרבת מקום — יש לסמן במפה את מיקום החניה",
  paid_lot: "חניון בתשלום בקרבת מקום — לסמן במפה",
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
