import {
  EVENT_TYPE_BAR_BAT,
  EVENT_TYPE_BACHELOR,
  EVENT_TYPE_BRIT,
  normalizeEventTypeLabel,
} from "@/lib/eventTypeOptions";

export type VenueOfferProductsSlice = {
  seaView: boolean;
  boutique: boolean;
  accessible: boolean;
  hasChuppa: boolean;
  hasChuppaOutdoor: boolean;
  hasChuppaCovered: boolean;
  hasBridalRoom: boolean;
  hasFood: boolean;
  hasVeganFood: boolean;
  hasTableSetup: boolean;
  hasDanceFloor: boolean;
  hasSoundSystem: boolean;
  hasAcumLicense: boolean;
  hasParkingNearby: boolean;
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
  hasChuppaOutdoor: "חופה בחוץ",
  hasChuppaCovered: "חופה מקורה",
  hasBridalRoom: "חדר כלה / חתן",
  hasFood: "בופה",
  hasVeganFood: "מנות טבעוניות / צמחוניות",
  hasTableSetup: "סידור שולחנות",
  hasDanceFloor: "רחבת ריקודים",
  hasSoundSystem: "מערכת הגברה",
  hasAcumLicense: 'רישיון אקו"ם',
  hasParkingNearby: "חניה באזור",
};

/** תוויות מותאמות לסוג אירוע (ברירת מחדל — OFFER_PRODUCT_LABELS) */
const OFFER_PRODUCT_LABELS_BY_EVENT: Partial<
  Record<string, Partial<Record<OfferProductKey, string>>>
> = {
  [EVENT_TYPE_BRIT]: {
    hasBridalRoom: "חדר פרטי / התארגנות",
    hasSoundSystem: "הגברה ומיקרופון",
    seaView: "גינה / חצר לטקס",
  },
};

export function offerProductLabelForEvent(
  key: OfferProductKey,
  eventType: string
): string {
  const et = normalizeEventTypeLabel(eventType.trim());
  const override = et ? OFFER_PRODUCT_LABELS_BY_EVENT[et]?.[key] : undefined;
  return override ?? OFFER_PRODUCT_LABELS[key];
}

/** מאפיין רך (JSON) — חיפוש לפי תווית שבעל האולם הוסיף */
export type SoftAttrFilterOption = { value: string; label: string };

export const SOFT_ATTR_FILTERS_BY_EVENT: Record<string, SoftAttrFilterOption[]> = {
  חתונה: [
    { value: "לובי", label: "לובי / קבלת פנים" },
    { value: "גג", label: "גג פתוח" },
    { value: "בר משקאות", label: "בר משקאות" },
    { value: "VIP", label: "אזור VIP" },
  ],
  "יום הולדת": [
    { value: "גינה", label: "גינה / חצר" },
    { value: "בריכ", label: "בריכה / מים" },
    { value: "מוזיק", label: "מוזיקה / DJ" },
    { value: "עמד", label: "עמדות / אטרקציות" },
  ],
  [EVENT_TYPE_BAR_BAT]: [
    { value: "במה", label: "במה / הופעות" },
    { value: "בר קינוחים", label: "בר / קינוחים" },
  ],
  [EVENT_TYPE_BRIT]: [
    { value: "מקרן", label: "מסך / מקרן" },
    { value: "הנקה", label: "חדר הנקה / שקט" },
    { value: "לובי", label: "לובי / קבלת פנים" },
    { value: "תאורה", label: "תאורה לאירוע" },
    { value: "גינה", label: "גינה / חצר" },
    { value: "עמד", label: "עמדת קינוחים" },
    { value: "קפה", label: "עמדת קפה / בוקר" },
    { value: "פרטי", label: "חדר פרטי לטקס" },
  ],
  חינה: [
    { value: "גינה", label: "גינה / חצר" },
    { value: "בר משקאות", label: "בר משקאות" },
  ],
  [EVENT_TYPE_BACHELOR]: [
    { value: "בר משקאות", label: "בר משקאות" },
    { value: "בריכ", label: "בריכה / ג'קוזי" },
    { value: "מוזיק", label: "מוזיקה / DJ" },
    { value: "עמד", label: "עמדות / אטרקציות" },
    { value: "לינה", label: "לינה במקום" },
    { value: "פרטי", label: "מקום פרטי / סגור" },
  ],
  "אירוע עסקי": [
    { value: "מקרן", label: "מסך / מקרן" },
    { value: "במה", label: "במה / במה להרצאות" },
    { value: "וייפיי", label: "Wi‑Fi / אינטרנט" },
    { value: "חניה", label: "חניה נוחה" },
    { value: "לובי", label: "לובי / קבלת פנים" },
  ],
  כנס: [
    { value: "מקרן", label: "מסך / מקרן" },
    { value: "במה", label: "במה / דוכן נואמים" },
    { value: "תרגום", label: "תרגום / תמלול" },
    { value: "וייפיי", label: "Wi‑Fi / אינטרנט" },
    { value: "חניה", label: "חניה נוחה" },
  ],
  "מסיבת סיום": [
    { value: "במה", label: "במה / הופעות" },
    { value: "מוזיק", label: "מוזיקה / DJ" },
    { value: "בר משקאות", label: "בר משקאות" },
    { value: "עמד", label: "עמדות / אטרקציות" },
  ],
  "אירוע אחר": [
    { value: "לובי", label: "לובי / קבלת פנים" },
    { value: "גינה", label: "גינה / חצר" },
    { value: "במה", label: "במה / הופעות" },
    { value: "בר משקאות", label: "בר משקאות" },
  ],
};

export type EventQuickChip = {
  id: string;
  label: string;
  toggles: Partial<VenueOfferProductsSlice>;
};

export type EventContextChip = {
  id: string;
  label: string;
  kashrut?: string;
  parkingKind?: string;
};

const WEDDING_PRODUCTS: OfferProductKey[] = [
  "seaView",
  "boutique",
  "accessible",
  "hasParkingNearby",
  "hasChuppa",
  "hasChuppaOutdoor",
  "hasChuppaCovered",
  "hasBridalRoom",
  "hasFood",
  "hasVeganFood",
  "hasTableSetup",
  "hasDanceFloor",
  "hasSoundSystem",
  "hasAcumLicense",
];

const PARTY_PRODUCTS: OfferProductKey[] = [
  "seaView",
  "boutique",
  "accessible",
  "hasParkingNearby",
  "hasFood",
  "hasVeganFood",
  "hasTableSetup",
  "hasDanceFloor",
  "hasSoundSystem",
  "hasAcumLicense",
];

const BRIT_PRODUCTS: OfferProductKey[] = [
  "accessible",
  "boutique",
  "hasParkingNearby",
  "seaView",
  "hasBridalRoom",
  "hasFood",
  "hasVeganFood",
  "hasTableSetup",
  "hasSoundSystem",
  "hasAcumLicense",
];

/** מסנני «מוצרים שהאולם מציעה» לפי סוג אירוע — null = לא נבחר סוג */
export function offerProductKeysForEventType(
  eventType: string
): OfferProductKey[] | null {
  const et = normalizeEventTypeLabel(eventType.trim());
  if (!et) return null;

  if (et === "חתונה") return WEDDING_PRODUCTS;
  if (et === EVENT_TYPE_BAR_BAT) return PARTY_PRODUCTS;
  if (et === EVENT_TYPE_BRIT) return BRIT_PRODUCTS;
  if (et === "חינה") {
    return [
      "seaView",
      "boutique",
      "hasParkingNearby",
      "hasFood",
      "hasDanceFloor",
      "hasSoundSystem",
      "hasAcumLicense",
      "hasTableSetup",
    ];
  }
  if (et === "יום הולדת") return PARTY_PRODUCTS;
  if (et === EVENT_TYPE_BACHELOR) {
    return [
      "seaView",
      "boutique",
      "accessible",
      "hasParkingNearby",
      "hasFood",
      "hasDanceFloor",
      "hasSoundSystem",
      "hasAcumLicense",
      "hasTableSetup",
    ];
  }
  if (et === "אירוע עסקי" || et === "כנס") {
    return [
      "accessible",
      "hasParkingNearby",
      "hasTableSetup",
      "hasSoundSystem",
      "hasAcumLicense",
      "hasFood",
      "hasVeganFood",
      "boutique",
      "seaView",
    ];
  }
  if (et === "מסיבת סיום") {
    return [
      "hasDanceFloor",
      "hasSoundSystem",
      "hasAcumLicense",
      "hasFood",
      "hasTableSetup",
      "accessible",
      "hasParkingNearby",
      "boutique",
    ];
  }
  return PARTY_PRODUCTS;
}

export function softAttrFiltersForEventType(
  eventType: string
): SoftAttrFilterOption[] {
  const et = normalizeEventTypeLabel(eventType.trim());
  if (!et) return [];
  return SOFT_ATTR_FILTERS_BY_EVENT[et] ?? [];
}

export function eventQuickChipsForEventType(eventType: string): EventQuickChip[] {
  const et = normalizeEventTypeLabel(eventType.trim());
  if (et === "חתונה") {
    return [
      {
        id: "wedding-full",
        label: "חבילה מלאה",
        toggles: {
          hasFood: true,
          hasTableSetup: true,
          hasDanceFloor: true,
          hasSoundSystem: true,
        },
      },
      {
        id: "wedding-garden",
        label: "חתונה בגינה",
        toggles: { seaView: true, hasChuppaOutdoor: true, hasChuppa: true },
      },
      {
        id: "wedding-indoor",
        label: "חופה מקורה",
        toggles: { hasChuppaCovered: true, hasChuppa: true },
      },
    ];
  }
  if (et === "יום הולדת") {
    return [
      {
        id: "bday-kids",
        label: "מסיבת ילדים",
        toggles: { boutique: true, hasSoundSystem: true, hasFood: true },
      },
      {
        id: "bday-dance",
        label: "מסיבה עם ריקודים",
        toggles: { hasDanceFloor: true, hasSoundSystem: true },
      },
    ];
  }
  if (et === EVENT_TYPE_BACHELOR) {
    return [
      {
        id: "bachelor-party",
        label: "מסיבה עם ריקודים ובר",
        toggles: {
          hasDanceFloor: true,
          hasSoundSystem: true,
          hasFood: true,
          boutique: true,
        },
      },
      {
        id: "bachelor-private",
        label: "מקום פרטי / קטן",
        toggles: { boutique: true, hasFood: true },
      },
      {
        id: "bachelor-outdoor",
        label: "בחוץ / עם נוף",
        toggles: { seaView: true, hasSoundSystem: true },
      },
    ];
  }
  if (et === EVENT_TYPE_BAR_BAT) {
    return [
      {
        id: "bm-party",
        label: "מסיבה + ריקודים",
        toggles: { hasDanceFloor: true, hasSoundSystem: true, hasFood: true },
      },
    ];
  }
  if (et === EVENT_TYPE_BRIT) {
    return [
      {
        id: "brit-small",
        label: "אירוע קטן ואינטימי",
        toggles: { boutique: true, hasFood: true, hasTableSetup: true },
      },
      {
        id: "brit-garden",
        label: "ברית בגינה / חצר",
        toggles: { seaView: true, hasTableSetup: true },
      },
      {
        id: "brit-tech",
        label: "הגברה ומסך",
        toggles: { hasSoundSystem: true, hasAcumLicense: true },
      },
      {
        id: "brit-private",
        label: "חדר פרטי לטקס",
        toggles: { hasBridalRoom: true, boutique: true },
      },
    ];
  }
  if (et === "חינה") {
    return [
      {
        id: "henna-garden",
        label: "חינה בגינה",
        toggles: { seaView: true, hasSoundSystem: true, hasFood: true },
      },
      {
        id: "henna-dance",
        label: "חינה עם ריקודים",
        toggles: { hasDanceFloor: true, hasSoundSystem: true, hasFood: true },
      },
    ];
  }
  if (et === "מסיבת סיום") {
    return [
      {
        id: "grad-party",
        label: "מסיבה עם ריקודים",
        toggles: { hasDanceFloor: true, hasSoundSystem: true, hasFood: true },
      },
      {
        id: "grad-small",
        label: "אירוע קטן",
        toggles: { boutique: true, hasFood: true },
      },
    ];
  }
  if (et === "אירוע עסקי" || et === "כנס") {
    return [
      {
        id: "conf-tech",
        label: "כנס עם הגברה",
        toggles: { hasSoundSystem: true, hasTableSetup: true },
      },
    ];
  }
  return [];
}

export function eventContextChipsForEventType(
  eventType: string
): EventContextChip[] {
  const et = normalizeEventTypeLabel(eventType.trim());
  const religious =
    et === "חתונה" ||
    et === EVENT_TYPE_BAR_BAT ||
    et === EVENT_TYPE_BRIT ||
    et === "חינה";
  const chips: EventContextChip[] = [];
  if (religious) {
    chips.push(
      { id: "k-mehadrin", label: "כשרות מהדרין", kashrut: "מהדרין" },
      { id: "k-regular", label: "כשרות רגילה", kashrut: "רגיל" }
    );
  }
  chips.push(
    { id: "p-adj", label: "חניה צמודה", parkingKind: "adjacent" },
    { id: "p-near", label: "חניה בקרבת מקום", parkingKind: "nearby" }
  );
  return chips;
}

export function showBirthdayAgeFilter(eventType: string): boolean {
  return normalizeEventTypeLabel(eventType.trim()) === "יום הולדת";
}

export function emptyOfferProductFilters(): VenueOfferProductsSlice {
  return {
    seaView: false,
    boutique: false,
    accessible: false,
    hasChuppa: false,
    hasChuppaOutdoor: false,
    hasChuppaCovered: false,
    hasBridalRoom: false,
    hasFood: false,
    hasVeganFood: false,
    hasTableSetup: false,
    hasDanceFloor: false,
    hasSoundSystem: false,
    hasAcumLicense: false,
    hasParkingNearby: false,
  };
}

export function clearHiddenOfferProductFilters(
  values: VenueOfferProductsSlice,
  visibleKeys: OfferProductKey[] | null
): VenueOfferProductsSlice {
  if (!visibleKeys) return emptyOfferProductFilters();
  const allowed = new Set(visibleKeys);
  const next = { ...values };
  for (const key of Object.keys(next) as OfferProductKey[]) {
    if (!allowed.has(key)) next[key] = false;
  }
  return next;
}

export function sliceOfferProductsFromForm(form: {
  seaView: boolean;
  boutique: boolean;
  accessible: boolean;
  hasChuppa: boolean;
  hasChuppaOutdoor: boolean;
  hasChuppaCovered: boolean;
  hasBridalRoom: boolean;
  hasFood: boolean;
  hasVeganFood: boolean;
  hasTableSetup: boolean;
  hasDanceFloor: boolean;
  hasSoundSystem: boolean;
  hasAcumLicense: boolean;
  hasParkingNearby: boolean;
}): VenueOfferProductsSlice {
  return {
    seaView: form.seaView,
    boutique: form.boutique,
    accessible: form.accessible,
    hasChuppa: form.hasChuppa,
    hasChuppaOutdoor: form.hasChuppaOutdoor,
    hasChuppaCovered: form.hasChuppaCovered,
    hasBridalRoom: form.hasBridalRoom,
    hasFood: form.hasFood,
    hasVeganFood: form.hasVeganFood,
    hasTableSetup: form.hasTableSetup,
    hasDanceFloor: form.hasDanceFloor,
    hasSoundSystem: form.hasSoundSystem,
    hasAcumLicense: form.hasAcumLicense,
    hasParkingNearby: form.hasParkingNearby,
  };
}
