import {
  CATEGORY_MULTI_SEPARATOR,
  CATEGORY_VALUE_SEPARATOR,
  FOOD_BEVERAGE_PRIMARY,
  parseServiceCategorySelections,
} from "@/lib/freelancerServiceCategories";
import { normalizeSecondaryName } from "@/lib/serviceCategorySpec";

/** אופציות תזונה/כשרות — לא קטגוריות נפרדות */
export const PRESET_DIETARY_OPTIONS = [
  "כשר למהדרין",
  "ללא גלוטן",
] as const;

export type PresetDietaryOption = (typeof PRESET_DIETARY_OPTIONS)[number];

/** שמות ישנים כתת־קטגוריה — מומרים לאופציות תזונה */
const LEGACY_DIETARY_SECONDARIES: Record<string, PresetDietaryOption> = {
  [normalizeSecondaryName("קייטרינג כשר למהדרין")]: "כשר למהדרין",
  [normalizeSecondaryName("קייטרינג ללא גלוטן")]: "ללא גלוטן",
};

export function isLegacyDietarySecondary(secondary: string): boolean {
  return normalizeSecondaryName(secondary.trim()) in LEGACY_DIETARY_SECONDARIES;
}

export function dietaryOptionFromLegacySecondary(
  secondary: string
): PresetDietaryOption | null {
  return (
    LEGACY_DIETARY_SECONDARIES[normalizeSecondaryName(secondary.trim())] ?? null
  );
}

/** מפריד קטגוריה ישנה: מסיר מהדרין/ללא גלוטן מהקטגוריה ומחזיר אותן כאופציות */
export function splitLegacyDietaryFromCategory(category: string | null | undefined): {
  category: string;
  dietaryOptions: string[];
} {
  if (!category?.trim()) return { category: "", dietaryOptions: [] };
  const { primary, secondaries } = parseServiceCategorySelections(category);
  const dietaryOptions: string[] = [];
  const kept: string[] = [];
  for (const s of secondaries) {
    const diet = dietaryOptionFromLegacySecondary(s);
    if (diet) {
      if (!dietaryOptions.includes(diet)) dietaryOptions.push(diet);
    } else {
      kept.push(s);
    }
  }
  if (!primary) {
    return { category: category.trim(), dietaryOptions };
  }
  if (kept.length === 0) {
    return { category: primary, dietaryOptions };
  }
  return {
    category: `${primary}${CATEGORY_VALUE_SEPARATOR}${kept.join(CATEGORY_MULTI_SEPARATOR)}`,
    dietaryOptions,
  };
}

export function showDietaryOptionsForCategory(
  category: string | null | undefined
): boolean {
  if (!category?.trim()) return false;
  const { primary } = parseServiceCategorySelections(category);
  return primary === FOOD_BEVERAGE_PRIMARY;
}

export function sanitizeDietaryOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const t = item.trim().slice(0, 80);
    if (!t) continue;
    if (!out.includes(t)) out.push(t);
    if (out.length >= 12) break;
  }
  return out;
}
