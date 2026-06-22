import {
  EVENT_TYPE_BAR_BAT,
  EVENT_TYPE_BRIT,
  normalizeEventTypeLabel,
} from "@/lib/eventTypeOptions";

export type VenueOfferProductsSlice = {
  seaView: boolean;
  boutique: boolean;
  accessible: boolean;
  hasChuppa: boolean;
  hasFood: boolean;
  hasTableSetup: boolean;
  hasDanceFloor: boolean;
  hasSoundSystem: boolean;
};

export type OfferProductKey = keyof VenueOfferProductsSlice;

export type BirthdayAgeGroup = "" | "kids" | "teens" | "adults" | "mixed";

export const BIRTHDAY_AGE_GROUP_OPTIONS: readonly {
  value: Exclude<BirthdayAgeGroup, "">;
  label: string;
}[] = [
  { value: "kids", label: "ילדים (עד 12)" },
  { value: "teens", label: "נוער (13–17)" },
  { value: "adults", label: "בוגרים (18+)" },
  { value: "mixed", label: "כל הגילאים" },
];

export const OFFER_PRODUCT_LABELS: Record<OfferProductKey, string> = {
  seaView: "גינה / חצר",
  boutique: "מתאים לאירועים קטנים",
  accessible: "נגישות לנכים",
  hasChuppa: "כולל חופה",
  hasFood: "בופה",
  hasTableSetup: "סידור שולחנות",
  hasDanceFloor: "רחבת ריקודים",
  hasSoundSystem: "מערכת הגברה",
};

/** מסנני «מוצרים שהאולם מציעה» לפי סוג אירוע — null = לא נבחר סוג */
export function offerProductKeysForEventType(
  eventType: string
): OfferProductKey[] | null {
  const et = normalizeEventTypeLabel(eventType.trim());
  if (!et) return null;

  if (et === "חתונה") {
    return [
      "seaView",
      "boutique",
      "accessible",
      "hasChuppa",
      "hasFood",
      "hasTableSetup",
      "hasDanceFloor",
      "hasSoundSystem",
    ];
  }
  if (et === EVENT_TYPE_BAR_BAT) {
    return [
      "accessible",
      "boutique",
      "hasFood",
      "hasTableSetup",
      "hasDanceFloor",
      "hasSoundSystem",
    ];
  }
  if (et === EVENT_TYPE_BRIT) {
    return ["accessible", "boutique", "hasFood", "hasTableSetup"];
  }
  if (et === "חינה") {
    return ["seaView", "boutique", "hasFood", "hasDanceFloor", "hasSoundSystem"];
  }
  if (et === "יום הולדת") {
    return [
      "boutique",
      "accessible",
      "hasFood",
      "hasDanceFloor",
      "hasSoundSystem",
      "hasTableSetup",
    ];
  }
  if (et === "אירוע עסקי" || et === "כנס") {
    return [
      "accessible",
      "hasTableSetup",
      "hasSoundSystem",
      "hasFood",
      "boutique",
    ];
  }
  if (et === "מסיבת סיום") {
    return [
      "hasDanceFloor",
      "hasSoundSystem",
      "hasFood",
      "hasTableSetup",
      "accessible",
    ];
  }
  return [
    "seaView",
    "boutique",
    "accessible",
    "hasFood",
    "hasTableSetup",
    "hasDanceFloor",
    "hasSoundSystem",
  ];
}

export function showBirthdayAgeFilter(eventType: string): boolean {
  return normalizeEventTypeLabel(eventType.trim()) === "יום הולדת";
}

export function clearHiddenOfferProductFilters(
  values: VenueOfferProductsSlice,
  visibleKeys: OfferProductKey[] | null
): VenueOfferProductsSlice {
  if (!visibleKeys) {
    return {
      seaView: false,
      boutique: false,
      accessible: false,
      hasChuppa: false,
      hasFood: false,
      hasTableSetup: false,
      hasDanceFloor: false,
      hasSoundSystem: false,
    };
  }
  const allowed = new Set(visibleKeys);
  const next = { ...values };
  for (const key of Object.keys(next) as OfferProductKey[]) {
    if (!allowed.has(key)) next[key] = false;
  }
  return next;
}
