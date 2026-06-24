/** מפתחות שירותי אולם עם תמחור (שרת + לקוח) — בלי "use client" */
export const HALL_VENUE_PRODUCT_DND_ITEMS = [
  { key: "hasFood", label: "בופה", supportsExtraPrice: true as const },
  { key: "hasTableSetup", label: "סידור שולחנות", supportsExtraPrice: true as const },
  { key: "hasSoundSystem", label: "מערכת הגברה", supportsExtraPrice: true as const },
  {
    key: "hasAcumLicense",
    label: 'רישיון אקו"ם',
    supportsExtraPrice: true as const,
  },
] as const;

/** הסבר קצר לבעל אולם — מוצג ליד שירותי «מה יש באולם» */
export const ACUM_VENUE_OWNER_HINT =
  'אקו"ם: רישיון חובה להשמעת מוזיקה באירוע. הגדירו אם כלול במחיר, בתוספת תשלום, או שהמחפש מסדיר לבד ב-acum.org.il.';

export type HallGeneralBuiltinKey =
  (typeof HALL_VENUE_PRODUCT_DND_ITEMS)[number]["key"];

export type BuiltinAmenityKeyFull = HallGeneralBuiltinKey;

export const VENUE_PRODUCT_BUILTIN_KEYS: HallGeneralBuiltinKey[] =
  HALL_VENUE_PRODUCT_DND_ITEMS.map((i) => i.key);

export type HallGeneralPriceMode = "included" | "extra" | "unplaced";

export function isHallGeneralPricePlaced(
  mode: HallGeneralPriceMode
): mode is "included" | "extra" {
  return mode === "included" || mode === "extra";
}

/** מצב UI בלבד — לשמירה ב-DB/API רק included | extra */
export function persistedHallGeneralPriceMode(
  mode: HallGeneralPriceMode
): "included" | "extra" {
  return mode === "extra" ? "extra" : "included";
}

export function hallGeneralAmenityLive(
  enabled: boolean,
  mode: HallGeneralPriceMode
): boolean {
  return enabled && isHallGeneralPricePlaced(mode);
}

export function findUnplacedHallGeneralLabel(options: {
  productHasFood: boolean;
  hasTableSetup: boolean;
  hasSoundSystem: boolean;
  hasAcumLicense: boolean;
  modes: Record<BuiltinAmenityKeyFull, HallGeneralPriceMode>;
  customRows: { label: string; checked: boolean; priceMode: HallGeneralPriceMode }[];
}): string | null {
  const bools: Record<HallGeneralBuiltinKey, boolean> = {
    hasFood: options.productHasFood,
    hasTableSetup: options.hasTableSetup,
    hasSoundSystem: options.hasSoundSystem,
    hasAcumLicense: options.hasAcumLicense,
  };
  for (const item of HALL_VENUE_PRODUCT_DND_ITEMS) {
    if (bools[item.key] && options.modes[item.key] === "unplaced") {
      return item.label;
    }
  }
  const custom = options.customRows.find(
    (r) => r.checked && r.priceMode === "unplaced"
  );
  return custom?.label ?? null;
}
