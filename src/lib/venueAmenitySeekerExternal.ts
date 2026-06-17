import {
  VENUE_PRODUCT_BUILTIN_KEYS,
  type BuiltinAmenityKeyFull,
} from "@/lib/venueBuiltinAmenities";

/** שדה ב-JSON של שירותים (customAmenitiesJson / customHallItems) */
export const SEEKER_EXTERNAL_JSON_KEY = "allowsSeekerExternalSource";

/** סוגי אירוע שבהם מותר ספק חיצוני (כשהמתג הראשי דלוק) */
export const SEEKER_EXTERNAL_EVENT_TYPES_KEY = "seekerExternalEventTypes";

/** פריטים מובנים שחלק מהאולם — אין בחירת ספק חיצוני (ריק — כל הפריטים ניתנים להגדרה) */
export const BUILTIN_FIXED_VENUE_ONLY_KEYS = new Set<BuiltinAmenityKeyFull>([]);

export function builtinAmenityOffersSeekerExternalConfig(
  _key: BuiltinAmenityKeyFull,
  _priceMode: "included" | "extra" = "included"
): boolean {
  return true;
}

export function defaultSeekerExternalForBuiltin(
  _key: BuiltinAmenityKeyFull,
  _priceMode: "included" | "extra" = "included"
): boolean {
  return false;
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

export function parseSeekerExternalEventTypesFromRecord(
  o: Record<string, unknown>
): string[] {
  const raw = o[SEEKER_EXTERNAL_EVENT_TYPES_KEY];
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0
  );
}

/** האם מותר ספק חיצוני לסוג האירוע בפנייה */
export function allowsSeekerExternalForInquiryEvent(
  masterEnabled: boolean,
  allowedEventTypes: string[] | undefined,
  inquiryEventType: string | null | undefined
): boolean {
  if (!masterEnabled) return false;
  if (!allowedEventTypes || allowedEventTypes.length === 0) return true;
  const et = inquiryEventType?.trim();
  if (!et) return false;
  return allowedEventTypes.includes(et);
}

export function seekerExternalEventTypesPayload(
  masterEnabled: boolean,
  eventTypes: string[]
): string[] | undefined {
  if (!masterEnabled) return undefined;
  const cleaned = eventTypes.filter((et) => et.trim().length > 0);
  return cleaned.length > 0 ? cleaned : undefined;
}

export function seekerExternalFieldsForPayload(
  masterEnabled: boolean,
  eventTypes: string[]
): {
  allowsSeekerExternalSource: boolean;
  seekerExternalEventTypes?: string[];
} {
  const allowed = seekerExternalEventTypesPayload(masterEnabled, eventTypes);
  return {
    allowsSeekerExternalSource: masterEnabled,
    ...(allowed ? { seekerExternalEventTypes: allowed } : {}),
  };
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

/** טקסטים לחלפת הצעת האולם בספק מהמאגר — לפי האם הפריט כלול או בתוספת */
export function inquiryReplacementCopy(priceMode: "included" | "extra") {
  if (priceMode === "included") {
    return {
      venueDefaultTitle: "כלול במחיר מהאולם",
      venueDefaultSubtitle: "רוצים משהו אחר? אפשר להביא ספק חיצוני בתשלום.",
      expandAlternatives: "להביא ספק אחר בתשלום",
      expandAlternativesSelected: "להחליף לספק אחר בתשלום",
      selectReplacement: "להביא בתשלום",
      selectedNote: "חלופה בתשלום במקום מה שהאולם מציע בחינם",
      panelIntro:
        "גללו ובחרו ספק בתשלום — הבחירה מחליפה את מה שהאולם מציע בחינם לפריט זה.",
      upgradeBadge: "אפשר חלופה בתשלום",
    } as const;
  }
  return {
    venueDefaultTitle: "מה שהאולם מציע",
    venueDefaultSubtitle: "ברירת מחדל — אפשר להחליף בספק מהמאגר.",
    expandAlternatives: "גללו ובחרו חלופה במאגר",
    expandAlternativesSelected: "החליפו חלופה אחרת במאגר",
    selectReplacement: "בחר במקום האולם",
    selectedNote: "חלופה במאגר במקום הצעת האולם",
    panelIntro: "גללו ברשימה ובחרו ספק — הבחירה מחליפה את מה שהאולם מציע לפריט הזה.",
    upgradeBadge: null,
  } as const;
}

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

export function initialBuiltinSeekerExternalEventTypesMap(): Record<
  BuiltinAmenityKeyFull,
  string[]
> {
  return Object.fromEntries(
    VENUE_PRODUCT_BUILTIN_KEYS.map((k) => [k, [] as string[]])
  ) as Record<BuiltinAmenityKeyFull, string[]>;
}
