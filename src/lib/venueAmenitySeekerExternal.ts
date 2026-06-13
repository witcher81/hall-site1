import {
  VENUE_PRODUCT_BUILTIN_KEYS,
  type BuiltinAmenityKeyFull,
} from "@/lib/venueBuiltinAmenities";

/** שדה ב-JSON של שירותים (customAmenitiesJson / customHallItems) */
export const SEEKER_EXTERNAL_JSON_KEY = "allowsSeekerExternalSource";

/** פריטים מובנים שחלק מהאולם — אין בחירת ספק חיצוני */
export const BUILTIN_FIXED_VENUE_ONLY_KEYS = new Set<BuiltinAmenityKeyFull>([
  "hasTableSetup",
]);

export function builtinAmenityOffersSeekerExternalConfig(
  key: BuiltinAmenityKeyFull,
  priceMode: "included" | "extra" = "included"
): boolean {
  if (priceMode === "extra") return true;
  return !BUILTIN_FIXED_VENUE_ONLY_KEYS.has(key);
}

export function defaultSeekerExternalForBuiltin(
  key: BuiltinAmenityKeyFull,
  priceMode: "included" | "extra" = "included"
): boolean {
  if (!builtinAmenityOffersSeekerExternalConfig(key, priceMode)) return false;
  return key === "hasFood" || key === "hasSoundSystem";
}

export function defaultSeekerExternalForCustomRow(): boolean {
  return false;
}

export function parseSeekerExternalFromRecord(
  o: Record<string, unknown>
): boolean | undefined {
  const v = o[SEEKER_EXTERNAL_JSON_KEY];
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  return undefined;
}

export function resolveSeekerExternalForBuiltin(
  key: BuiltinAmenityKeyFull,
  stored: boolean | undefined,
  priceMode: "included" | "extra" = "included"
): boolean {
  if (!builtinAmenityOffersSeekerExternalConfig(key, priceMode)) return false;
  if (typeof stored === "boolean") return stored;
  return defaultSeekerExternalForBuiltin(key, priceMode);
}

export function resolveSeekerExternalForCustomRow(
  stored: boolean | undefined,
  /** פריטי «מה יש באולם» לסוג אירוע / חתונה — ברירת מחדל ללא חיצוני */
  defaultWhenMissing = false
): boolean {
  if (typeof stored === "boolean") return stored;
  return defaultWhenMissing;
}

/** טקסטים משותפים — טופס פנייה / בחירת אולם (צד מחפש) */
export const INQUIRY_EXTERNAL_SOURCE_COPY = {
  venueRadio: "דרך האולם",
  externalRadio: "להביא ספק חיצוני",
  venueOnlyLine: "חלק מהאולם — דרך האולם בלבד.",
  servicesSectionHelp:
    "פריטים שחלק מהאולם (רחבה, חופה וכו׳) — דרך האולם בלבד. איפה שהאולם מאפשר, אפשר לבחור דרך האולם או להביא ספק חיצוני.",
  inquiryPageIntro:
    "בוחרים תאריך, סוג אירוע ואורחים — ולכל שירות שהאולם מציע בוחרים דרך האולם או להביא ספק חיצוני (כשהאולם מאפשר).",
  publicHallIntro:
    "בדף נפרד תמלאו תאריך, כמות אורחים, סוג אירוע (אופציונלי) ובחירה לכל שירות — דרך האולם או להביא ספק חיצוני כשהאולם מאפשר.",
} as const;

export function initialBuiltinSeekerExternalMap(): Record<
  BuiltinAmenityKeyFull,
  boolean
> {
  return Object.fromEntries(
    VENUE_PRODUCT_BUILTIN_KEYS.map((k) => [
      k,
      defaultSeekerExternalForBuiltin(k, "included"),
    ])
  ) as Record<BuiltinAmenityKeyFull, boolean>;
}
