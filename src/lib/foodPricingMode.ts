import { parseServiceCategorySelections } from "@/lib/freelancerServiceCategories";
import { normalizeSecondaryName } from "@/lib/serviceCategorySpec";
import type { CatalogTemplateId } from "@/lib/serviceCategoryTemplates";

/**
 * איך מתמחרים אוכל פר־ראש בקייטרינג.
 * `per_person` / `general` — ערכים ישנים בלבד (תאימות לאחור).
 */
export type FoodPricingMode =
  | "fixed_per_head"
  | "pyramid_per_head"
  | "per_person"
  | "general";

/** אפשרויות בחירה חדשות במסך */
export type FoodPricingModeChoice = "fixed_per_head" | "pyramid_per_head";

type PyramidTierSeed = {
  id: string;
  minQty: number;
  maxQty: number | null;
  pricePerUnit: number | null;
  secondary?: string;
};

/** תת־קטגוריות שהן עמדה/עוגה — תפריט עמדה בלבד, בלי שאלת מודל */
const STATION_ONLY_SECONDARIES = new Set(
  [
    "בר מתוקים",
    "עמדת גלידה",
    "עמדת וופל בלגי",
    "עמדת קרפים",
    "עמדת פופקורן",
    "עמדת סושי",
    "עוגות לאירועים",
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
  if (secondaries.length === 0) return false;
  if (secondaries.some((s) => isStationOnlySecondary(s))) return false;
  return secondaries.some((s) =>
    FOOD_PRICING_CHOICE_SECONDARIES.has(normalizeSecondaryName(s.trim()))
  );
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
