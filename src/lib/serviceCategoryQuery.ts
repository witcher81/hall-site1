import type { Prisma } from "@prisma/client";
import {
  CATEGORY_MULTI_SEPARATOR,
  CATEGORY_VALUE_SEPARATOR,
  composeServiceCategoryValue,
  getSecondaryServicesForPrimary,
  parseServiceCategoryValue,
  parseServiceCategorySelections,
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
  "איפור כלות": "יופי ואיפור",
  איפור: "יופי ואיפור",
  שיער: "יופי ואיפור",
  הזמנות: "הזמנות ודפוס",
  "שמלות כלה": "הלבשה ואופנה לאירוע",
  "חליפות חתן": "הלבשה ואופנה לאירוע",
  הסעות: "צוותים ותפעול לאירוע",
  לימוזינה: "צוותים ותפעול לאירוע",
  ברמנים: "צוותים ותפעול לאירוע",
  "שירותי קהל ותפעול": "צוותים ותפעול לאירוע",
  "הצעות נישואין": "תכנון וניהול אירוע",
};

/** תוויות משניות ישנות / חלקיות → שם מדויק בקטלוג */
export const LEGACY_PROVIDER_SECONDARY_ALIASES: Record<string, string> = {
  DJ: "DJ ותקליטנים",
  "די ג'יי": "DJ ותקליטנים",
  זמר: "זמר/ת לאירוע",
  זמרים: "זמר/ת לאירוע",
  מגנט: "צלם מגנטים",
  מגנטים: "צלם מגנטים",
  ברמנים: "ברמנים",
  הסעות: "הסעות אורחים",
  לימוזינה: "השכרת לימוזינה",
  "הצעות נישואין": "הצעות נישואין",
};

function resolveSecondaryAgainstPrimary(primary: string, secondary: string): string {
  const sec = secondary.trim();
  if (!sec || !primary) return sec;
  const options = getSecondaryServicesForPrimary(primary);
  if (options.includes(sec)) return sec;

  const aliased = LEGACY_PROVIDER_SECONDARY_ALIASES[sec] ?? sec;
  if (options.includes(aliased)) return aliased;

  // קייטרינג רחב — בלי תת־קטגוריה (יש כמה סוגי קייטרינג)
  if (sec === "קייטרינג" || aliased === "קייטרינג") return "";

  const prefixHit = options.find(
    (opt) => opt.startsWith(sec) || opt.includes(sec) || sec.startsWith(opt)
  );
  return prefixHit ?? aliased;
}

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
  let sec = (secondaryParam ?? "").trim();
  if (!cat) return { primary: "", secondary: "" };

  if (cat.includes(CATEGORY_VALUE_SEPARATOR)) {
    const parsed = parseServiceCategoryValue(cat);
    const primary =
      LEGACY_PROVIDER_CATEGORY_TO_PRIMARY[parsed.primary] ?? parsed.primary;
    return {
      primary,
      secondary: resolveSecondaryAgainstPrimary(
        primary,
        parsed.secondary || sec
      ),
    };
  }

  const primary = LEGACY_PROVIDER_CATEGORY_TO_PRIMARY[cat] ?? cat;
  // קטגוריה שהגיעה כתת־שירות (למשל «הצעות נישואין») בלי secondary מפורש
  if (!sec && LEGACY_PROVIDER_CATEGORY_TO_PRIMARY[cat] && cat !== primary) {
    const asSecondary = resolveSecondaryAgainstPrimary(primary, cat);
    if (asSecondary) sec = asSecondary;
  }
  return {
    primary,
    secondary: resolveSecondaryAgainstPrimary(primary, sec),
  };
}

/** תנאי Prisma לסינון לפי קטגוריה ראשית / משנית */
export function buildServiceCategoryWhere(
  categoryParam: string,
  secondaryParam?: string
): Pick<Prisma.ServiceWhereInput, "OR"> {
  const { primary, secondary } = resolveProviderCategoryFilter(
    categoryParam,
    secondaryParam
  );
  if (!primary) return {};

  if (secondary) {
    const exact = composeServiceCategoryValue(primary, secondary);
    const sec = secondary.trim();
    return {
      OR: [
        { category: exact },
        { category: { startsWith: `${exact}${CATEGORY_MULTI_SEPARATOR}` } },
        {
          category: {
            contains: `${CATEGORY_MULTI_SEPARATOR}${sec}${CATEGORY_MULTI_SEPARATOR}`,
          },
        },
        { category: { endsWith: `${CATEGORY_MULTI_SEPARATOR}${sec}` } },
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
      const { secondaries } = parseServiceCategorySelections(stored);
      if (secondaries.includes(secondary.trim())) return true;
      return stored === composeServiceCategoryValue(primary, secondary);
    }
    const { primary: p } = parseServiceCategorySelections(stored);
    const norm = LEGACY_PROVIDER_CATEGORY_TO_PRIMARY[p] ?? p;
    return norm === primary || stored.startsWith(`${primary}${CATEGORY_VALUE_SEPARATOR}`);
  }

  const { primary, secondaries } = parseServiceCategorySelections(stored);
  const normPrimary = LEGACY_PROVIDER_CATEGORY_TO_PRIMARY[primary] ?? primary;
  if (normPrimary !== spec.primary && !stored.startsWith(`${spec.primary}${CATEGORY_VALUE_SEPARATOR}`)) {
    return false;
  }
  if (!spec.secondaryIncludes?.length) return true;
  const hay = `${secondaries.join(" ")} ${stored}`.toLowerCase();
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
