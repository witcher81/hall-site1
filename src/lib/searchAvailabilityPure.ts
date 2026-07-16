import {
  FREELANCER_CATEGORY_GROUPS,
  FREELANCER_PRIMARY_CATEGORIES,
  parseServiceCategorySelections,
} from "@/lib/freelancerServiceCategories";

export type ServiceCategoryAvailability = {
  /** קטגוריות ראשיות שיש להן לפחות שירות מאושר אחד */
  primaries: string[];
  /** לכל ראשית — תתי־קטגוריות שיש להן לפחות שירות מאושר אחד */
  secondariesByPrimary: Record<string, string[]>;
};

export type SearchAvailabilityPayload = {
  cities: string[];
  primaries: string[];
  secondariesByPrimary: Record<string, string[]>;
};

/** מיפוי טהור: מחרוזות category מאושרות → זמינות לפי טקסונומיה */
export function buildServiceCategoryAvailabilityFromCategories(
  categoryStrings: string[]
): ServiceCategoryAvailability {
  const primarySet = new Set<string>();
  const secondaryMap = new Map<string, Set<string>>();

  for (const raw of categoryStrings) {
    const { primary, secondaries } = parseServiceCategorySelections(raw);
    if (!primary) continue;
    primarySet.add(primary);
    if (!secondaryMap.has(primary)) {
      secondaryMap.set(primary, new Set());
    }
    const secSet = secondaryMap.get(primary)!;
    for (const s of secondaries) {
      if (s) secSet.add(s);
    }
  }

  const secondariesByPrimary: Record<string, string[]> = {};
  for (const group of FREELANCER_CATEGORY_GROUPS) {
    const available = secondaryMap.get(group.primary);
    if (!available || available.size === 0) {
      secondariesByPrimary[group.primary] = [];
      continue;
    }
    secondariesByPrimary[group.primary] = group.services.filter((s) =>
      available.has(s)
    );
  }

  const primaries = FREELANCER_PRIMARY_CATEGORIES.filter((p) =>
    primarySet.has(p)
  );

  return { primaries, secondariesByPrimary };
}

export function isPrimaryAvailable(
  availability: ServiceCategoryAvailability,
  primary: string
): boolean {
  const p = primary.trim();
  if (!p) return false;
  return availability.primaries.includes(p);
}

export function isSecondaryAvailable(
  availability: ServiceCategoryAvailability,
  primary: string,
  secondary: string
): boolean {
  const p = primary.trim();
  const s = secondary.trim();
  if (!p || !s) return false;
  return (availability.secondariesByPrimary[p] ?? []).includes(s);
}

export function isCityAvailable(
  availableCities: readonly string[],
  city: string
): boolean {
  const c = city.trim().toLowerCase();
  if (!c) return false;
  return availableCities.some((x) => x.trim().toLowerCase() === c);
}
