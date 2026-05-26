import {
  CATEGORY_VALUE_SEPARATOR,
  composeServiceCategoryValue,
  parseServiceCategoryValue,
} from "@/lib/freelancerServiceCategories";

/** תוויות ישנות (חיפוש / מדריכים) → קטגוריה ראשית במאגר */
export const LEGACY_PROVIDER_CATEGORY_TO_PRIMARY: Record<string, string> = {
  צילום: "צילום ותיעוד",
  וידאו: "צילום ותיעוד",
  DJ: "מוזיקה ובמה",
  קייטרינג: "אוכל ומשקאות",
  פרחים: "עיצוב ומיתוג",
  "עיצוב אירועים": "עיצוב ומיתוג",
  הנחיה: "מוזיקה ובמה",
  מוזיקה: "מוזיקה ובמה",
  איפור: "יופי, איפור וסטיילינג",
  שיער: "יופי, איפור וסטיילינג",
  הזמנות: "הזמנות, מתנות והדפסות",
  "הדפסות והזמנות": "הזמנות, מתנות והדפסות",
};

/** מיפוי לבדיקות event-plan (מזהה שירות + תווית ישנה) */
const LEGACY_BUCKET_MATCHERS: Record<
  string,
  { primary: string; secondaryIncludes?: string[] }
> = {
  צילום: { primary: "צילום ותיעוד" },
  DJ: {
    primary: "מוזיקה ובמה",
    secondaryIncludes: ["DJ", "די", "תקליט"],
  },
  קייטרינג: {
    primary: "אוכל ומשקאות",
    secondaryIncludes: ["קייטרינג"],
  },
};

export function resolveProviderCategoryFilter(
  categoryParam: string,
  secondaryParam?: string
): { primary: string; secondary: string } {
  const cat = categoryParam.trim();
  const sec = (secondaryParam ?? "").trim();
  if (!cat) return { primary: "", secondary: "" };

  if (cat.includes(CATEGORY_VALUE_SEPARATOR)) {
    const parsed = parseServiceCategoryValue(cat);
    return {
      primary: LEGACY_PROVIDER_CATEGORY_TO_PRIMARY[parsed.primary] ?? parsed.primary,
      secondary: parsed.secondary || sec,
    };
  }

  const primary = LEGACY_PROVIDER_CATEGORY_TO_PRIMARY[cat] ?? cat;
  return { primary, secondary: sec };
}

/** תנאי Prisma לסינון לפי קטגוריה ראשית / משנית */
export function buildServiceCategoryWhere(
  categoryParam: string,
  secondaryParam?: string
): {
  OR?: Array<{ category: string } | { category: { startsWith: string } }>;
} {
  const { primary, secondary } = resolveProviderCategoryFilter(
    categoryParam,
    secondaryParam
  );
  if (!primary) return {};

  if (secondary) {
    const exact = composeServiceCategoryValue(primary, secondary);
    return {
      OR: [
        { category: exact },
        { category: { startsWith: `${exact}${CATEGORY_VALUE_SEPARATOR}` } },
      ],
    };
  }

  return {
    OR: [
      { category: primary },
      { category: { startsWith: `${primary}${CATEGORY_VALUE_SEPARATOR}` } },
    ],
  };
}

export function serviceMatchesLegacyBucket(
  storedCategory: string | null | undefined,
  legacyBucket: string
): boolean {
  const stored = (storedCategory ?? "").trim();
  if (!stored) return false;

  const spec = LEGACY_BUCKET_MATCHERS[legacyBucket.trim()];
  if (!spec) {
    const { primary, secondary } = resolveProviderCategoryFilter(legacyBucket);
    if (!primary) return false;
    if (secondary) {
      return stored === composeServiceCategoryValue(primary, secondary);
    }
    const { primary: p } = parseServiceCategoryValue(stored);
    const norm = LEGACY_PROVIDER_CATEGORY_TO_PRIMARY[p] ?? p;
    return norm === primary || stored.startsWith(`${primary}${CATEGORY_VALUE_SEPARATOR}`);
  }

  const { primary, secondary } = parseServiceCategoryValue(stored);
  const normPrimary = LEGACY_PROVIDER_CATEGORY_TO_PRIMARY[primary] ?? primary;
  if (normPrimary !== spec.primary && !stored.startsWith(`${spec.primary}${CATEGORY_VALUE_SEPARATOR}`)) {
    return false;
  }
  if (!spec.secondaryIncludes?.length) return true;
  const hay = `${secondary} ${stored}`.toLowerCase();
  return spec.secondaryIncludes.some((frag) => hay.includes(frag.toLowerCase()));
}

export function providersHrefForCategory(
  category: string,
  secondary?: string
): string {
  const { primary, secondary: sec } = resolveProviderCategoryFilter(category, secondary);
  const params = new URLSearchParams();
  if (primary) params.set("category", primary);
  if (sec) params.set("secondary", sec);
  const qs = params.toString();
  return `/providers${qs ? `?${qs}` : ""}`;
}
