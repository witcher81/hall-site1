/** תוויות מאוחדות לסוגי אירוע — במקום פריטים נפרדים לבן/בת וברית/בריתה */

export const EVENT_TYPE_BAR_BAT = "בר מצווה / בת מצווה";
export const EVENT_TYPE_BRIT = "ברית / בריתה";

const LEGACY_BAR_BAT = ["בר מצווה", "בת מצווה"] as const;
const LEGACY_BRIT = ["ברית", "בריתה"] as const;

/** רשימה מלאה — סינון חיפוש (אולמות, חבילות) */
export const STANDARD_EVENT_TYPE_OPTIONS = [
  "חתונה",
  EVENT_TYPE_BAR_BAT,
  EVENT_TYPE_BRIT,
  "חינה",
  "יום הולדת",
  "אירוע עסקי",
  "כנס",
  "מסיבת סיום",
  "אירוע אחר",
] as const;

export type StandardEventTypeOption = (typeof STANDARD_EVENT_TYPE_OPTIONS)[number];

/** חיפוש אולמות */
export const HALL_SEARCH_EVENT_TYPE_OPTIONS = STANDARD_EVENT_TYPE_OPTIONS;

/** חיפוש חבילות */
export const PACKAGE_SEARCH_EVENT_TYPE_OPTIONS = STANDARD_EVENT_TYPE_OPTIONS;

/** בקשות / event-builder / שירותים */
export const COMMON_INQUIRY_EVENT_TYPE_OPTIONS = STANDARD_EVENT_TYPE_OPTIONS;

/** סוגי אירוע — בעל אולם (יצירה/עריכה) */
export const VENUE_PRESET_EVENT_TYPES = [
  "חתונה",
  EVENT_TYPE_BAR_BAT,
  EVENT_TYPE_BRIT,
  "חינה",
  "אירוע עסקי",
  "כנס",
  "יום הולדת",
] as const;

/** תוכניות אירוע (my-plans) */
export const EVENT_PLAN_EVENT_TYPE_OPTIONS = [
  "חתונה",
  EVENT_TYPE_BAR_BAT,
  EVENT_TYPE_BRIT,
  "יום הולדת",
] as const;

/** מדריך אחרי בחירת אולם */
export const AFTER_VENUE_EVENT_TYPE_OPTIONS = [
  "חתונה",
  "יום הולדת",
  EVENT_TYPE_BAR_BAT,
  EVENT_TYPE_BRIT,
  "אחר",
] as const;

export function normalizeEventTypeLabel(label: string): string {
  const t = label.trim();
  if ((LEGACY_BAR_BAT as readonly string[]).includes(t)) return EVENT_TYPE_BAR_BAT;
  if ((LEGACY_BRIT as readonly string[]).includes(t)) return EVENT_TYPE_BRIT;
  if (t === "אחר") return "אירוע אחר";
  return t;
}

/** ממזג תוויות ישנות ומסיר כפילויות — לתצוגה ולשמירה */
export function normalizeEventTypesList(types: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of types) {
    const n = normalizeEventTypeLabel(t);
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

export function eventTypeLabelsMatch(a: string, b: string): boolean {
  return normalizeEventTypeLabel(a) === normalizeEventTypeLabel(b);
}

export function eventTypesListIncludes(types: string[], label: string): boolean {
  const target = normalizeEventTypeLabel(label);
  return types.some((t) => normalizeEventTypeLabel(t) === target);
}

export function toggleEventTypeInList(
  types: string[],
  label: string,
  checked: boolean
): string[] {
  const target = normalizeEventTypeLabel(label);
  const without = types.filter((t) => normalizeEventTypeLabel(t) !== target);
  return checked ? [...without, target] : without;
}

/** וарианты לחיפוש JSON (contains) — תואם גם נתונים ישנים ב-DB */
export function eventTypeSearchContainsVariants(filterType: string): string[] {
  const n = normalizeEventTypeLabel(filterType);
  if (n === EVENT_TYPE_BAR_BAT) {
    return [...LEGACY_BAR_BAT, EVENT_TYPE_BAR_BAT];
  }
  if (n === EVENT_TYPE_BRIT) {
    return [...LEGACY_BRIT, EVENT_TYPE_BRIT];
  }
  return [n];
}

/** מפתח פרופיל ב-JSON שמור — כשהמפתח הישן שונה מהתווית המאוחדת */
export function findStoredEventTypeProfileKey(
  eventType: string,
  storedKeys: string[]
): string | null {
  if (storedKeys.includes(eventType)) return eventType;
  const normalized = normalizeEventTypeLabel(eventType);
  if (storedKeys.includes(normalized)) return normalized;
  if (normalized === EVENT_TYPE_BAR_BAT) {
    for (const k of [...LEGACY_BAR_BAT, EVENT_TYPE_BAR_BAT]) {
      if (storedKeys.includes(k)) return k;
    }
  }
  if (normalized === EVENT_TYPE_BRIT) {
    for (const k of [...LEGACY_BRIT, EVENT_TYPE_BRIT]) {
      if (storedKeys.includes(k)) return k;
    }
  }
  return null;
}

export function isBarBatEventType(label: string): boolean {
  return normalizeEventTypeLabel(label) === EVENT_TYPE_BAR_BAT;
}

export function isBritEventType(label: string): boolean {
  return normalizeEventTypeLabel(label) === EVENT_TYPE_BRIT;
}
