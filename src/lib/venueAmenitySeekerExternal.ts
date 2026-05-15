import type { BuiltinAmenityKeyFull } from "@/lib/venueBuiltinAmenities";

/** שדה ב-JSON של שירותים (customAmenitiesJson / customHallItems) */
export const SEEKER_EXTERNAL_JSON_KEY = "allowsSeekerExternalSource";

/** פריטים מובנים שחלק מהאולם — אין בחירת ספק חיצוני */
export const BUILTIN_FIXED_VENUE_ONLY_KEYS = new Set<BuiltinAmenityKeyFull>([
  "hasDanceFloor",
  "hasTableSetup",
  "hasBridalRoom",
]);

export function builtinAmenityOffersSeekerExternalConfig(
  key: BuiltinAmenityKeyFull
): boolean {
  return !BUILTIN_FIXED_VENUE_ONLY_KEYS.has(key);
}

export function defaultSeekerExternalForBuiltin(key: BuiltinAmenityKeyFull): boolean {
  if (!builtinAmenityOffersSeekerExternalConfig(key)) return false;
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
  stored: boolean | undefined
): boolean {
  if (!builtinAmenityOffersSeekerExternalConfig(key)) return false;
  if (typeof stored === "boolean") return stored;
  return defaultSeekerExternalForBuiltin(key);
}

export function resolveSeekerExternalForCustomRow(
  stored: boolean | undefined,
  /** פריטי «מה יש באולם» לסוג אירוע / חתונה — ברירת מחדל ללא חיצוני */
  defaultWhenMissing = false
): boolean {
  if (typeof stored === "boolean") return stored;
  return defaultWhenMissing;
}

export function initialBuiltinSeekerExternalMap(): Record<
  BuiltinAmenityKeyFull,
  boolean
> {
  return Object.fromEntries(
    (
      [
        "hasFood",
        "hasDanceFloor",
        "hasTableSetup",
        "hasSoundSystem",
        "hasBridalRoom",
      ] as BuiltinAmenityKeyFull[]
    ).map((k) => [k, defaultSeekerExternalForBuiltin(k)])
  ) as Record<BuiltinAmenityKeyFull, boolean>;
}
