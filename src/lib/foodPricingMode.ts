import { parseServiceCategorySelections } from "@/lib/freelancerServiceCategories";
import { normalizeSecondaryName } from "@/lib/serviceCategorySpec";
import type { CatalogTemplateId } from "@/lib/serviceCategoryTemplates";

/**
 * איך מתמחרים אוכל בקייטרינג / שולחן.
 * `per_person` — ערך ישן (≈ מחיר קבוע לראש).
 */
export type FoodPricingMode =
  | "fixed_per_head"
  | "pyramid_per_head"
  | "per_person"
  | "general";

/** אפשרויות בחירה במסך */
export type FoodPricingModeChoice = "fixed_per_head" | "pyramid_per_head";

type PyramidTierSeed = {
  id: string;
  minQty: number;
  maxQty: number | null;
  pricePerUnit: number | null;
  secondary?: string;
};

/** תת־קטגוריות שהן עמדה/שולחן קבוע — בלי שאלת פר־ראש */
const STATION_ONLY_SECONDARIES = new Set(
  [
    "בר מתוקים",
    "עמדת גלידה",
    "עמדת וופל בלגי",
    "עמדת קרפים",
    "עמדת פופקורן",
    "עמדת סושי",
    "עוגות לאירועים",
    "שולחן שוק",
  ].map(normalizeSecondaryName)
);

/** תת־קטגוריות שבהן שואלים: מחיר קבוע לראש או פירמידה יורדת */
const FOOD_PRICING_CHOICE_SECONDARIES = new Set(
  [
    "קייטרינג חלבי",
    "קייטרינג בשרי",
    "קייטרינג צמחוני",
    "קייטרינג טבעוני",
    "שף פרטי לאירוע",
    "שף על האש",
    "סדנאות אוכל",
    "מזנונים ודוכני אוכל",
    "קינוחים ושולחנות מתוקים",
  ].map(normalizeSecondaryName)
);

export function isStationOnlySecondary(
  secondary: string | null | undefined
): boolean {
  if (!secondary?.trim()) return false;
  return STATION_ONLY_SECONDARIES.has(normalizeSecondaryName(secondary.trim()));
}

export function needsFoodPricingModeChoice(
  category: string | null | undefined
): boolean {
  if (!category?.trim()) return false;
  const { secondaries } = parseServiceCategorySelections(category);
  return secondariesNeedingFoodPricingChoice(secondaries).length > 0;
}

/** תת־קטגוריות בשירות שצריכות בחירת מודל מחיר */
export function secondariesNeedingFoodPricingChoice(
  secondaries: string[]
): string[] {
  const list = secondaries.map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) return [];
  return list.filter((s) => {
    const n = normalizeSecondaryName(s);
    if (STATION_ONLY_SECONDARIES.has(n)) return false;
    return FOOD_PRICING_CHOICE_SECONDARIES.has(n);
  });
}

export function isFixedPerHeadMode(mode: FoodPricingMode | null | undefined): boolean {
  return mode === "fixed_per_head" || mode === "per_person";
}

export function isPyramidPerHeadMode(mode: FoodPricingMode | null | undefined): boolean {
  return mode === "pyramid_per_head";
}

export function isLegacyGeneralFoodMode(
  mode: FoodPricingMode | null | undefined
): boolean {
  return mode === "general";
}

/** מצב מחיר לתת־קטגוריה — עם נפילה למצב הכללי הישן (רק אם אין מפה לפי תת־קטגוריה) */
export function resolveFoodPricingModeForSecondary(
  menu: {
    foodPricingMode?: FoodPricingMode | null;
    foodPricingModesBySecondary?: Record<string, FoodPricingMode> | null;
  },
  secondary: string
): FoodPricingMode | null {
  const key = secondary.trim();
  const map = menu.foodPricingModesBySecondary;
  const by = map?.[key];
  if (by) return by;
  // אחרי בחירה/ביטול פר־תת־קטגוריה — אין נפילה לגלובלי (אחרת אי־אפשר לבטל אחת)
  if (map && Object.keys(map).length > 0) return null;
  return menu.foodPricingMode ?? null;
}

/**
 * כשיש כמה תת־קטגוריות ומודל גלובלי ישן בלבד — מעתיקים למפה כדי שביטול בחירה
 * באחת לא ישפיע על האחרות דרך ה־fallback.
 */
export function expandGlobalFoodPricingToSecondaries(
  menu: {
    foodPricingMode?: FoodPricingMode | null;
    foodPricingModesBySecondary?: Record<string, FoodPricingMode> | null;
  },
  secondaries: string[]
): {
  foodPricingMode: null;
  foodPricingModesBySecondary: Record<string, FoodPricingMode>;
} | null {
  const needing = secondariesNeedingFoodPricingChoice(secondaries);
  if (needing.length <= 1) return null;
  const map = menu.foodPricingModesBySecondary;
  if (map && Object.keys(map).length > 0) return null;
  const global = menu.foodPricingMode;
  if (!global) return null;
  return {
    foodPricingMode: null,
    foodPricingModesBySecondary: Object.fromEntries(
      needing.map((s) => [s, global])
    ),
  };
}

export function hasAllFoodPricingModesChosen(
  menu: {
    foodPricingMode?: FoodPricingMode | null;
    foodPricingModesBySecondary?: Record<string, FoodPricingMode> | null;
  },
  secondaries: string[]
): boolean {
  const needing = secondariesNeedingFoodPricingChoice(secondaries);
  if (needing.length === 0) return true;
  return needing.every((s) => isActiveFoodPricingMode(resolveFoodPricingModeForSecondary(menu, s)));
}

/** מספיק תת־קטגוריה אחת עם מודל — התפריט נפתח בנפרד לכל אחת שנבחרה */
export function hasAnyFoodPricingModeChosen(
  menu: {
    foodPricingMode?: FoodPricingMode | null;
    foodPricingModesBySecondary?: Record<string, FoodPricingMode> | null;
  },
  secondaries: string[]
): boolean {
  const needing = secondariesNeedingFoodPricingChoice(secondaries);
  if (needing.length === 0) return true;
  return needing.some((s) =>
    isActiveFoodPricingMode(resolveFoodPricingModeForSecondary(menu, s))
  );
}

/** מודל פעיל לבחירה בממשק (לא כולל «הצעה כללית» ישנה) */
export function isActiveFoodPricingMode(
  mode: FoodPricingMode | null | undefined
): boolean {
  return isFixedPerHeadMode(mode) || isPyramidPerHeadMode(mode);
}

/** ערך לבחירה בממשק (ישן → חדש) */
export function foodPricingModeForChooser(
  mode: FoodPricingMode | null | undefined
): FoodPricingModeChoice | null {
  if (mode === "fixed_per_head" || mode === "per_person") return "fixed_per_head";
  if (mode === "pyramid_per_head") return "pyramid_per_head";
  return null;
}

export function templateIdForFoodPricingMode(
  mode: FoodPricingMode
): CatalogTemplateId {
  return mode === "general" ? "food_station" : "food";
}

export function parseFoodPricingMode(raw: unknown): FoodPricingMode | null {
  if (
    raw === "fixed_per_head" ||
    raw === "pyramid_per_head" ||
    raw === "per_person" ||
    raw === "general"
  ) {
    return raw;
  }
  return null;
}

function newTierId(): string {
  return `tier_${Math.random().toString(36).slice(2, 10)}`;
}

/** מדרגות דוגמה לפירמידה יורדת — המחיר ממולא ע״י הספק */
export function createDefaultPyramidGuestTiers(
  secondary?: string | null
): PyramidTierSeed[] {
  const sec = secondary?.trim() || null;
  return [
    {
      id: newTierId(),
      minQty: 1,
      maxQty: 40,
      pricePerUnit: null,
      ...(sec ? { secondary: sec } : {}),
    },
    {
      id: newTierId(),
      minQty: 41,
      maxQty: null,
      pricePerUnit: null,
      ...(sec ? { secondary: sec } : {}),
    },
  ];
}

export const FOOD_PRICING_MODE_OPTIONS: Array<{
  value: FoodPricingModeChoice;
  title: string;
  hint: string;
}> = [
  {
    value: "fixed_per_head",
    title: "מחיר קבוע לראש",
    hint: "אותו מחיר לאורח — לא משנה כמה מוזמנים. + תפריט מנות לכל קבוצה (מבוגרים / ילדים…).",
  },
  {
    value: "pyramid_per_head",
    title: "פירמידה יורדת",
    hint: "ככל שיש יותר אורחים — המחיר לראש יורד. למשל עד 40 אורחים ₪80 לראש, ומעל 40 — ₪70 לראש.",
  },
];
