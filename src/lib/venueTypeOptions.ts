/**
 * סוג מקום — אותם ערכים בחיפוש ציבורי ובטופס בעל האולם (שדה `Venue.venueType`).
 * ערך «אחר» נשמר כטקסט חופשי (לא ברשימה המוגדרת).
 */

import { USER_INPUT_MAX } from "@/lib/userInputValidation";

/** ערך ב-select בלבד — לא נשמר ב-DB */
export const VENUE_TYPE_OTHER_SENTINEL = "__venue_type_other__";

export const VENUE_TYPE_CUSTOM_MAX_LEN = USER_INPUT_MAX.EVENT_TYPE_FREE;

export const VENUE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "אולם", label: "אולם אירועים" },
  { value: "גן", label: "גן אירועים" },
  { value: "גן ואולם", label: "גן ואולם" },
  { value: "וילה", label: "וילה לאירועים" },
  { value: "חווה", label: "חווה / אירועים בטבע" },
  { value: "רופטופ", label: "רופטופ / מרפסת גג" },
  { value: "טנט", label: "טנט / אירוע בשטח פתוח" },
  { value: "חוף", label: "חוף / אירוע על הים" },
  { value: "יאכטה", label: "יאכטה / אירוע על הסיפון" },
  { value: "כרם", label: "כרם / יקב לאירועים" },
  { value: "חצר פרטית", label: "חצר / גינה פרטית" },
  { value: "לופט", label: "לופט / חלל תעשייתי" },
  { value: "מרחב אמנות / גלריה", label: "גלריה / מרחב אמנות" },
  { value: "מוזיאון", label: "מוזיאון / אתר מורשת" },
  { value: "מסעדה", label: "מסעדה / מקום אוכל לאירועים" },
  { value: "אולם במלון", label: "אולם במלון" },
  { value: "מלון", label: "מלון / מתחם אירוח" },
  { value: "מרכז כנסים", label: "מרכז קונגרסים / כנסים" },
  { value: "אולם קהילתי", label: "אולם קהילתי / מתנ״ס" },
  {
    value: "בית כנסת כאולם",
    label: "בית כנסת / אולם אירועים בקהילה",
  },
  { value: "קיבוץ", label: "קיבוץ / מושב (מתחם כפרי)" },
  { value: "שמורת טבע", label: "שמורת טבע / אגם" },
  { value: "מקלט", label: "מקלט / מרתף לאירועים" },
  { value: "דירת Airbnb", label: "דירת Airbnb / דירת אירוח" },
  { value: "צימר", label: "צימר / יחידת אירוח כפרית" },
  { value: "בוטיק", label: "מלון בוטיק / מתחם בוטיק" },
];

/** ערכים מוגדרים מראש — לסינון חיפוש ולבחירה בטופס */
export const VENUE_TYPE_VALUE_SET = new Set(
  VENUE_TYPE_OPTIONS.map((o) => o.value)
);

const VENUE_TYPE_LEGACY_ALIASES: Record<string, string> = {
  "גן אירועים": "גן",
};

export function isKnownVenueType(value: string): boolean {
  return VENUE_TYPE_VALUE_SET.has(value.trim());
}

/** טעינת טופס עריכה — שומר ערך מותאם אישית כפי שנשמר */
export function resolveVenueTypeInitial(stored: string | null | undefined): string {
  const t = (stored ?? "").trim();
  if (!t) return "אולם";
  if (VENUE_TYPE_VALUE_SET.has(t)) return t;
  const alias = VENUE_TYPE_LEGACY_ALIASES[t];
  if (alias) return alias;
  return t;
}

export function parseVenueTypeFromForm(raw: unknown): {
  value: string | null;
  error: string | null;
} {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t) return { value: null, error: "נא לבחור סוג מקום." };
  if (t === VENUE_TYPE_OTHER_SENTINEL) {
    return { value: null, error: "נא לציין איך אתם קוראים לסוג המקום." };
  }
  if (isKnownVenueType(t)) return { value: t, error: null };
  if (t.length < 2) {
    return { value: null, error: "שם סוג המקום קצר מדי." };
  }
  if (t.length > VENUE_TYPE_CUSTOM_MAX_LEN) {
    return { value: null, error: "שם סוג המקום ארוך מדי." };
  }
  return { value: t, error: null };
}

/** תווית לעמוד אולם ציבורי — מסתיר «אולם» (ברירת מחדל); שאר הסוגים עם שם ברור */
export function getVenueTypePublicLabel(
  stored: string | null | undefined
): string | null {
  const t = (stored ?? "").trim();
  if (!t || t === "אולם") return null;
  const opt = VENUE_TYPE_OPTIONS.find((o) => o.value === t);
  return opt?.label ?? t;
}

export function venueTypeSelectValue(
  stored: string,
  mode: "form" | "search"
): string {
  if (mode === "search") return stored;
  if (isKnownVenueType(stored)) return stored;
  return VENUE_TYPE_OTHER_SENTINEL;
}
