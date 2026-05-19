/**
 * סוג מקום — אותם ערכים בחיפוש ציבורי ובטופס בעל האולם (שדה `Venue.venueType`).
 */

export const VENUE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "אולם", label: "אולם" },
  { value: "גן", label: "גן אירועים" },
  { value: "גן ואולם", label: "גן ואולם" },
  { value: "רופטופ", label: "רופטופ" },
  {
    value: "בית כנסת כאולם",
    label: "בית כנסת המשמש גם כאולם אירועים",
  },
  { value: "לופט", label: "לופט / לופט לאירועים" },
  { value: "דירת Airbnb", label: "דירת Airbnb / דירת אירוח" },
  { value: "אולם במלון", label: "אולם במלון / חללי כנסים" },
  { value: "מרחב אמנות / גלריה", label: "גלריה / מרחב אמנות לאירועים" },
  { value: "חצר פרטית", label: "חצר / גינה פרטית גדולה" },
];

/** ערכים חוקיים ל־`Venue.venueType` ולסינון חיפוש */
export const VENUE_TYPE_VALUE_SET = new Set(
  VENUE_TYPE_OPTIONS.map((o) => o.value)
);

/** טעינת טופס עריכה / אולם ישן בלי ערך תקין */
export function resolveVenueTypeInitial(stored: string | null | undefined): string {
  const t = (stored ?? "").trim();
  if (VENUE_TYPE_VALUE_SET.has(t)) return t;
  if (t === "גן אירועים") return "גן";
  return "אולם";
}

export function parseVenueTypeFromForm(raw: unknown): {
  value: string | null;
  error: string | null;
} {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t) return { value: null, error: "נא לבחור סוג מקום." };
  if (!VENUE_TYPE_VALUE_SET.has(t)) return { value: null, error: "סוג מקום לא תקין." };
  return { value: t, error: null };
}

/** תווית לעמוד אולם ציבורי — מסתיר «אולם» (ברירת מחדל מיותרת); שאר הסוגים עם שם ברור */
export function getVenueTypePublicLabel(
  stored: string | null | undefined
): string | null {
  const t = resolveVenueTypeInitial(stored);
  if (t === "אולם") return null;
  const opt = VENUE_TYPE_OPTIONS.find((o) => o.value === t);
  return opt?.label ?? t;
}
