/** מפתחות שירותי אולם עם תמחור (שרת + לקוח) — בלי "use client" */
export const HALL_VENUE_PRODUCT_DND_ITEMS = [
  { key: "hasFood", label: "כולל אוכל", supportsExtraPrice: true as const },
  { key: "hasDanceFloor", label: "רחבת ריקודים", supportsExtraPrice: true as const },
  { key: "hasTableSetup", label: "סידור שולחנות", supportsExtraPrice: true as const },
  { key: "hasSoundSystem", label: "מערכת הגברה", supportsExtraPrice: true as const },
  { key: "hasBridalRoom", label: "חדר חתן/כלה", supportsExtraPrice: true as const },
] as const;

export type HallGeneralBuiltinKey =
  (typeof HALL_VENUE_PRODUCT_DND_ITEMS)[number]["key"];

export type BuiltinAmenityKeyFull = HallGeneralBuiltinKey;

export const VENUE_PRODUCT_BUILTIN_KEYS: HallGeneralBuiltinKey[] =
  HALL_VENUE_PRODUCT_DND_ITEMS.map((i) => i.key);

export type HallGeneralPriceMode = "included" | "extra";
