/**
 * טלפון נייד ישראלי: קידומות 050–059 בלבד.
 * אחרי כל קידומת מגוינות בדיוק 7 ספרות (ללא מקפים).
 */

export const ISRAELI_MOBILE_PREFIXES: readonly string[] = [
  "050",
  "051",
  "052",
  "053",
  "054",
  "055",
  "056",
  "057",
  "058",
  "059",
];

export function normalizeIsraeliPhoneDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/** בודק מספר נייד מלא (רק ספרות), למשל 0501234567 */
export function isValidIsraeliMobilePhone(fullDigits: string): boolean {
  const d = normalizeIsraeliPhoneDigits(fullDigits);
  return ISRAELI_MOBILE_PREFIXES.some(
    (p) => d.startsWith(p) && d.length === p.length + 7
  );
}

export function buildIsraeliPhone(prefix: string, sevenDigits: string): string {
  return prefix + normalizeIsraeliPhoneDigits(sevenDigits).slice(0, 7);
}
