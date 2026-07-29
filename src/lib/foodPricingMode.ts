import { parseServiceCategorySelections } from "@/lib/freelancerServiceCategories";
import { normalizeSecondaryName } from "@/lib/serviceCategorySpec";
import type { CatalogTemplateId } from "@/lib/serviceCategoryTemplates";

/** איך מוכרים אוכל בקייטרינג / מזנון — לא חל על עמדות */
export type FoodPricingMode = "per_person" | "general";

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

/** תת־קטגוריות שבהן שואלים: פר־ראש או כללי */
const FOOD_PRICING_CHOICE_SECONDARIES = new Set(
  [
    "קייטרינג חלבי",
    "קייטרינג בשרי",
    "קייטרינג צמחוני",
    "קייטרינג טבעוני",
    "שף פרטי לאירוע",
    "שף על האש",
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
  // אם יש עמדה ברורה ברשימה — לא שואלים
  if (secondaries.some((s) => isStationOnlySecondary(s))) return false;
  return secondaries.some((s) =>
    FOOD_PRICING_CHOICE_SECONDARIES.has(normalizeSecondaryName(s.trim()))
  );
}

export function templateIdForFoodPricingMode(
  mode: FoodPricingMode
): CatalogTemplateId {
  return mode === "per_person" ? "food" : "food_station";
}

export function parseFoodPricingMode(raw: unknown): FoodPricingMode | null {
  if (raw === "per_person" || raw === "general") return raw;
  return null;
}

export const FOOD_PRICING_MODE_OPTIONS: Array<{
  value: FoodPricingMode;
  title: string;
  hint: string;
}> = [
  {
    value: "per_person",
    title: "לפי אדם (פר ראש)",
    hint: "מחיר לאורח + תפריט מנות לכל קבוצה (מבוגרים / ילדים…).",
  },
  {
    value: "general",
    title: "כללי — שולחן / הצעה קבועה",
    hint: "מחיר קבוע להצעה (למשל שולחן אוכל) + רשימה של מה מציעים.",
  },
];
