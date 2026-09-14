export const ISRAELI_PHONE_REGEX =
  /^(0(?:2|3|4|8|9)\d{7}|0(?:5|7)\d{8})$/;

/** קידומות נייד — 050–059 (מקור אחיד לכל הטפסים) */
export const ISRAELI_MOBILE_PREFIXES = [
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
] as const;

export type IsraeliMobilePrefix = (typeof ISRAELI_MOBILE_PREFIXES)[number];

export function normalizePhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function normalizePhoneRest7(value: string): string {
  return value.replace(/\D/g, "").slice(0, 7);
}

/**
 * מפרק מספר מלא לקידומת + 7 ספרות.
 * תומך גם בהדבקה של מספר מלא (0501234567 / 050-123-4567) לשדה אחד.
 */
export function splitIsraeliMobilePhone(digits: string): {
  prefix: IsraeliMobilePrefix;
  rest: string;
} {
  const d = normalizePhoneInput(digits);
  if (!d) return { prefix: "050", rest: "" };

  const found = ISRAELI_MOBILE_PREFIXES.find((p) => d.startsWith(p));
  if (found) {
    return { prefix: found, rest: normalizePhoneRest7(d.slice(found.length)) };
  }

  // 9725XXXXXXXX → 05XXXXXXXX
  if (d.startsWith("972") && d.length >= 12) {
    const local = `0${d.slice(3)}`;
    return splitIsraeliMobilePhone(local);
  }

  if (d.startsWith("05") && d.length >= 3) {
    const maybe = d.slice(0, 3) as IsraeliMobilePrefix;
    if ((ISRAELI_MOBILE_PREFIXES as readonly string[]).includes(maybe)) {
      return { prefix: maybe, rest: normalizePhoneRest7(d.slice(3)) };
    }
    return { prefix: "050", rest: normalizePhoneRest7(d.slice(3)) };
  }

  // רק 7 ספרות ללא קידומת
  if (d.length <= 7) {
    return { prefix: "050", rest: normalizePhoneRest7(d) };
  }

  return { prefix: "050", rest: "" };
}

export function composeIsraeliMobilePhone(
  prefix: string,
  rest: string
): string {
  const p = ISRAELI_MOBILE_PREFIXES.includes(prefix as IsraeliMobilePrefix)
    ? (prefix as IsraeliMobilePrefix)
    : "050";
  // אם המשתמש הדביק מספר מלא לשדה ה־7 ספרות — מפרקים מחדש
  const restDigits = rest.replace(/\D/g, "");
  if (restDigits.length >= 9 && restDigits.startsWith("05")) {
    const split = splitIsraeliMobilePhone(restDigits);
    return split.prefix + split.rest;
  }
  return p + normalizePhoneRest7(rest);
}

export function formatIsraeliMobileDisplay(full: string): string {
  const { prefix, rest } = splitIsraeliMobilePhone(full);
  if (!rest) return prefix;
  return `${prefix}-${rest}`;
}

export function isValidIsraeliPhone(value: string): boolean {
  return ISRAELI_PHONE_REGEX.test(normalizePhoneInput(value));
}
