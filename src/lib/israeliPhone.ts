/**
 * טלפון נייד ישראלי: קידומות 050–059 בלבד.
 * אחרי כל קידומת בדיוק 7 ספרות (ללא מקפים).
 */

import {
  ISRAELI_MOBILE_PREFIXES,
  composeIsraeliMobilePhone,
  normalizePhoneInput,
  splitIsraeliMobilePhone,
  formatIsraeliMobileDisplay,
} from "@/lib/phone";

export {
  ISRAELI_MOBILE_PREFIXES,
  normalizePhoneInput as normalizeIsraeliPhoneDigits,
  splitIsraeliMobilePhone,
  formatIsraeliMobileDisplay,
};

/** בודק מספר נייד מלא (רק ספרות), למשל 0501234567 */
export function isValidIsraeliMobilePhone(fullDigits: string): boolean {
  const d = normalizePhoneInput(fullDigits);
  return ISRAELI_MOBILE_PREFIXES.some(
    (p) => d.startsWith(p) && d.length === p.length + 7
  );
}

/** בונה מספר מלא מקידומת + 7 ספרות; תומך בהדבקת מספר מלא לשדה הספרות */
export function buildIsraeliPhone(prefix: string, sevenDigits: string): string {
  const digits = normalizePhoneInput(sevenDigits);
  if (digits.length >= 9 && digits.startsWith("05")) {
    const full = normalizePhoneInput(digits);
    if (isValidIsraeliMobilePhone(full)) return full;
  }
  return composeIsraeliMobilePhone(prefix, digits);
}
