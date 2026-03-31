export const ISRAELI_PHONE_REGEX =
  /^(0(?:2|3|4|8|9)\d{7}|0(?:5|7)\d{8})$/;

/** קידומות נייד נפוצות לבחירה בטפסים */
export const ISRAELI_MOBILE_PREFIXES = [
  "050",
  "051",
  "052",
  "053",
  "054",
  "055",
  "058",
] as const;

export type IsraeliMobilePrefix = (typeof ISRAELI_MOBILE_PREFIXES)[number];

export function normalizePhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function normalizePhoneRest7(value: string): string {
  return value.replace(/\D/g, "").slice(0, 7);
}

export function splitIsraeliMobilePhone(digits: string): {
  prefix: IsraeliMobilePrefix;
  rest: string;
} {
  const d = normalizePhoneInput(digits);
  if (!d) return { prefix: "050", rest: "" };
  const found = ISRAELI_MOBILE_PREFIXES.find((p) => d.startsWith(p));
  if (found) return { prefix: found, rest: normalizePhoneRest7(d.slice(3)) };
  if (d.startsWith("05") && d.length > 3) {
    return { prefix: "050", rest: normalizePhoneRest7(d.slice(3)) };
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
  return p + normalizePhoneRest7(rest);
}

export function isValidIsraeliPhone(value: string): boolean {
  return ISRAELI_PHONE_REGEX.test(value);
}

