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
    { value: "בריכ", label: "בריכה / מים" },
    { value: "עמד", label: "עמדות / אטרקציות" },
    { value: "במה", label: "במה / הופעות" },
    { value: "בר קינוחים", label: "בר קינוחים" },
    { value: "לובי", label: "לובי / קבלת פנים" },
  ],
  [EVENT_TYPE_BAR_BAT]: [
    { value: "במה", label: "במה / הופעות" },
    { value: "בר קינוחים", label: "בר / קינוחים" },
    { value: "לובי", label: "לובי / קבלת פנים" },
  ],
  [EVENT_TYPE_BRIT]: [
    { value: "מקרן", label: "מסך / מקרן" },
    { value: "הנקה", label: "חדר הנקה / שקט" },
    { value: "לובי", label: "לובי / קבלת פנים" },
    { value: "תאורה", label: "תאורה לאירוע" },
    { value: "עמד", label: "עמדת קינוחים" },
    { value: "קפה", label: "עמדת קפה / בוקר" },
  ],
  חינה: [
    { value: "בר משקאות", label: "בר משקאות" },
    { value: "לובי", label: "לובי / קבלת פנים" },
  ],
  [EVENT_TYPE_BACHELOR]: [
    { value: "בר משקאות", label: "בר משקאות" },
    { value: "בריכ", label: "בריכה / ג'קוזי" },
    { value: "עמד", label: "עמדות / אטרקציות" },
    { value: "לינה", label: "לינה במקום" },
    { value: "פרטי", label: "מקום פרטי / סגור" },
  ],
  "אירוע עסקי": [
    { value: "מקרן", label: "מסך / מקרן" },
    { value: "במה", label: "במה / במה להרצאות" },
    { value: "וייפיי", label: "Wi‑Fi / אינטרנט" },
    { value: "לובי", label: "לובי / קבלת פנים" },
  ],
  כנס: [
    { value: "מקרן", label: "מסך / מקרן" },
    { value: "במה", label: "במה / דוכן נואמים" },
    { value: "תרגום", label: "תרגום / תמלול" },
    { value: "וייפיי", label: "Wi‑Fi / אינטרנט" },
  ],
  "מסיבת סיום": [
    { value: "במה", label: "במה / הופעות" },
    { value: "בר משקאות", label: "בר משקאות" },
    { value: "עמד", label: "עמדות / אטרקציות" },
  ],
  "אירוע אחר": [
    { value: "לובי", label: "לובי / קבלת פנים" },
    { value: "במה", label: "במה / הופעות" },
    { value: "בר משקאות", label: "בר משקאות" },
  ],
};

export type EventQuickChip = {
  id: string;
  label: string;
  toggles: Partial<VenueOfferProductsSlice>;
  /** אופציונלי — ליום הולדת */
  birthdayAgeGroup?: BirthdayAgeGroup;
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
  "hasChuppa",
  "hasChuppaOutdoor",
  "hasChuppaCovered",
  "hasBridalRoom",
  "hasTableSetup",
  "hasDanceFloor",
  "hasSoundSystem",
  "hasAcumLicense",
];

const PARTY_PRODUCTS: OfferProductKey[] = [
  "seaView",
  "boutique",
  "accessible",
  "hasTableSetup",
  "hasDanceFloor",
  "hasSoundSystem",
  "hasAcumLicense",
];

const BRIT_PRODUCTS: OfferProductKey[] = [
  "accessible",
  "boutique",
  "seaView",
  "hasBridalRoom",
  "hasTableSetup",
  "hasSoundSystem",
  "hasAcumLicense",
];

/** מסנני «מוצרים שהאולם מציעה» לפי סוג אירוע — null = לא נבחר סוג.
 * אוכל/כשרות/חניה — בסקשנים נפרדים למעלה (בלי כפילות כאן). */
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
      "hasDanceFloor",
      "hasSoundSystem",
      "hasAcumLicense",
      "hasTableSetup",
    ];
  }
  if (et === "אירוע עסקי" || et === "כנס") {
    return [
      "accessible",
      "hasTableSetup",
      "hasSoundSystem",
      "hasAcumLicense",
      "boutique",
      "seaView",
    ];
  }
  if (et === "מסיבת סיום") {
    return [
      "hasDanceFloor",
      "hasSoundSystem",
      "hasAcumLicense",
      "hasTableSetup",
      "accessible",
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
  const raw = SOFT_ATTR_FILTERS_BY_EVENT[et] ?? [];
  const offerKeys = offerProductKeysForEventType(et) ?? [];
  const offerLabels = new Set(
    offerKeys.map((k) =>
      offerProductLabelForEvent(k, et).toLowerCase().replace(/\s+/g, " ")
    )
  );
  const seen = new Set<string>();
  return raw.filter((opt) => {
    const label = opt.label.toLowerCase().replace(/\s+/g, " ");
    const value = opt.value.toLowerCase();
    if (seen.has(label) || seen.has(value)) return false;
    if (offerLabels.has(label)) return false;
    for (const ol of offerLabels) {
      if (ol.includes(label) || label.includes(ol)) return false;
      // גינה vs גינה / חצר
      const olCore = ol.split("/")[0]?.trim() ?? ol;
      const labelCore = label.split("/")[0]?.trim() ?? label;
      if (olCore && labelCore && olCore === labelCore) return false;
    }
    seen.add(label);
    seen.add(value);
    return true;
  });
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
      {
        id: "wedding-bridal",
        label: "עם חדר כלה",
        toggles: { hasBridalRoom: true },
      },
      {
        id: "wedding-vegan",
        label: "מנות טבעוניות",
        toggles: { hasFood: true, hasVeganFood: true },
      },
      {
        id: "wedding-parking",
        label: "עם חניה",
        toggles: { hasParkingNearby: true },
      },
      {
        id: "wedding-access",
        label: "נגיש לנכים",
        toggles: { accessible: true },
      },
      {
        id: "wedding-small",
        label: "אירוע קטן",
        toggles: { boutique: true, hasFood: true },
      },
    ];
  }
  if (et === "יום הולדת") {
    return [
      {
        id: "bday-kids",
        label: "מסיבת ילדים",
        toggles: { boutique: true, hasSoundSystem: true, hasFood: true },
        birthdayAgeGroup: "kids",
      },
      {
        id: "bday-teens",
        label: "מסיבת נוער",
        toggles: { hasDanceFloor: true, hasSoundSystem: true, hasFood: true },
        birthdayAgeGroup: "teens",
      },
      {
        id: "bday-adults",
        label: "יום הולדת לבוגרים",
        toggles: {
          hasDanceFloor: true,
          hasSoundSystem: true,
          hasFood: true,
          hasTableSetup: true,
        },
        birthdayAgeGroup: "adults",
      },
      {
        id: "bday-dance",
        label: "מסיבה עם ריקודים",
        toggles: { hasDanceFloor: true, hasSoundSystem: true },
      },
      {
        id: "bday-food",
        label: "עם אוכל / בופה",
        toggles: { hasFood: true, hasTableSetup: true },
      },
      {
        id: "bday-garden",
        label: "גינה / חצר",
        toggles: { seaView: true },
      },
      {
        id: "bday-small",
        label: "מקום קטן ואינטימי",
        toggles: { boutique: true, hasFood: true },
      },
      {
        id: "bday-sound",
        label: "עם הגברה",
        toggles: { hasSoundSystem: true, hasAcumLicense: true },
      },
      {
        id: "bday-parking",
        label: "עם חניה",
        toggles: { hasParkingNearby: true },
      },
      {
        id: "bday-access",
        label: "נגיש לנכים",
        toggles: { accessible: true },
      },
      {
        id: "bday-vegan",
        label: "מנות טבעוניות",
        toggles: { hasFood: true, hasVeganFood: true },
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
      {
        id: "bachelor-sound",
        label: "עם הגברה וריקודים",
        toggles: { hasDanceFloor: true, hasSoundSystem: true, hasAcumLicense: true },
      },
      {
        id: "bachelor-parking",
        label: "עם חניה",
        toggles: { hasParkingNearby: true },
      },
      {
        id: "bachelor-food",
        label: "עם אוכל",
        toggles: { hasFood: true, hasTableSetup: true },
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
      {
        id: "bm-food",
        label: "עם אוכל ושולחנות",
        toggles: { hasFood: true, hasTableSetup: true },
      },
      {
        id: "bm-garden",
        label: "גינה / חצר",
        toggles: { seaView: true, hasSoundSystem: true },
      },
      {
        id: "bm-small",
        label: "אירוע קטן",
        toggles: { boutique: true, hasFood: true },
      },
      {
        id: "bm-sound",
        label: "במה והגברה",
        toggles: { hasSoundSystem: true, hasAcumLicense: true },
      },
      {
        id: "bm-parking",
        label: "עם חניה",
        toggles: { hasParkingNearby: true },
      },
      {
        id: "bm-access",
        label: "נגיש לנכים",
        toggles: { accessible: true },
      },
      {
        id: "bm-vegan",
        label: "מנות טבעוניות",
        toggles: { hasFood: true, hasVeganFood: true },
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
      {
        id: "brit-food",
        label: "עם אוכל",
        toggles: { hasFood: true, hasTableSetup: true },
      },
      {
        id: "brit-parking",
        label: "עם חניה",
        toggles: { hasParkingNearby: true },
      },
      {
        id: "brit-access",
        label: "נגיש לנכים",
        toggles: { accessible: true },
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
      {
        id: "henna-food",
        label: "עם אוכל ושולחנות",
        toggles: { hasFood: true, hasTableSetup: true },
      },
      {
        id: "henna-small",
        label: "אירוע קטן",
        toggles: { boutique: true, hasFood: true },
      },
      {
        id: "henna-sound",
        label: "עם הגברה",
        toggles: { hasSoundSystem: true, hasAcumLicense: true },
      },
      {
        id: "henna-parking",
        label: "עם חניה",
        toggles: { hasParkingNearby: true },
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
      {
        id: "grad-food",
        label: "עם אוכל",
        toggles: { hasFood: true, hasTableSetup: true },
      },
      {
        id: "grad-sound",
        label: "במה והגברה",
        toggles: { hasSoundSystem: true, hasAcumLicense: true },
      },
      {
        id: "grad-parking",
        label: "עם חניה",
        toggles: { hasParkingNearby: true },
      },
      {
        id: "grad-access",
        label: "נגיש לנכים",
        toggles: { accessible: true },
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
      {
        id: "conf-food",
        label: "עם כיבוד / אוכל",
        toggles: { hasFood: true, hasTableSetup: true },
      },
      {
        id: "conf-access",
        label: "נגיש לנכים",
        toggles: { accessible: true },
      },
      {
        id: "conf-parking",
        label: "עם חניה",
        toggles: { hasParkingNearby: true },
      },
      {
        id: "conf-small",
        label: "אולם קטן / ישיבות",
        toggles: { boutique: true, hasTableSetup: true },
      },
      {
        id: "conf-vegan",
        label: "מנות טבעוניות",
        toggles: { hasFood: true, hasVeganFood: true },
      },
      {
        id: "conf-outdoor",
        label: "עם גינה / חצר",
        toggles: { seaView: true },
      },
    ];
  }
  if (et === "אירוע אחר") {
    return [
      {
        id: "other-food",
        label: "עם אוכל",
        toggles: { hasFood: true, hasTableSetup: true },
      },
      {
        id: "other-dance",
        label: "עם ריקודים",
        toggles: { hasDanceFloor: true, hasSoundSystem: true },
      },
      {
        id: "other-garden",
        label: "גינה / חצר",
        toggles: { seaView: true },
      },
      {
        id: "other-small",
        label: "מקום קטן",
        toggles: { boutique: true },
      },
      {
        id: "other-parking",
        label: "עם חניה",
        toggles: { hasParkingNearby: true },
      },
      {
        id: "other-access",
        label: "נגיש לנכים",
        toggles: { accessible: true },
      },
    ];
  }
  return [
    {
      id: "generic-food",
      label: "עם אוכל",
      toggles: { hasFood: true, hasTableSetup: true },
    },
    {
      id: "generic-dance",
      label: "עם ריקודים",
      toggles: { hasDanceFloor: true, hasSoundSystem: true },
    },
    {
      id: "generic-garden",
      label: "גינה / חצר",
      toggles: { seaView: true },
    },
    {
      id: "generic-parking",
      label: "עם חניה",
      toggles: { hasParkingNearby: true },
    },
    {
      id: "generic-access",
      label: "נגיש לנכים",
      toggles: { accessible: true },
    },
  ];
}

export function eventContextChipsForEventType(
  _eventType: string
): EventContextChip[] {
  // כשרות — תחת סקשן האוכל; חניה — בבחירת «חניה» בפילטרים נוספים.
  // אין צ'יפים כפולים כאן.
  return [];
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
