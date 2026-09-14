import { parseServiceMenuJson } from "@/lib/serviceMenu";

export type ServiceReadinessInput = {
  category?: string | null;
  serviceArea?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  menuJson?: string | null;
};

export type ServiceReadinessCheck = {
  id: "category" | "serviceArea" | "price" | "coverImage" | "description";
  label: string;
  done: boolean;
};

export type ServiceReadiness = {
  checks: ServiceReadinessCheck[];
  doneCount: number;
  total: number;
  percent: number;
  ready: boolean;
};

const DESC_MIN = 20;

function hasPricedMenu(menuJson: string | null | undefined): boolean {
  if (!menuJson?.trim()) return false;
  const menu = parseServiceMenuJson(menuJson);
  if (!menu) return false;
  for (const pkg of menu.packages ?? []) {
    if (pkg.perGuestPrice != null && pkg.perGuestPrice > 0) return true;
    if (pkg.perGuestMin != null && pkg.perGuestMin > 0) return true;
    for (const item of [...(pkg.includedItems ?? []), ...(pkg.extraItems ?? [])]) {
      if (item.exactPrice != null && item.exactPrice > 0) return true;
      if (item.minPrice != null && item.minPrice > 0) return true;
      if (item.maxPrice != null && item.maxPrice > 0) return true;
    }
  }
  for (const section of menu.sections ?? []) {
    for (const item of section.items ?? []) {
      if (item.exactPrice != null && item.exactPrice > 0) return true;
      if (item.minPrice != null && item.minPrice > 0) return true;
      if (item.maxPrice != null && item.maxPrice > 0) return true;
    }
  }
  return false;
}

function hasPrice(input: ServiceReadinessInput): boolean {
  if (input.minPrice != null && input.minPrice > 0) return true;
  if (input.maxPrice != null && input.maxPrice > 0) return true;
  return hasPricedMenu(input.menuJson);
}

function descriptionText(input: ServiceReadinessInput): string {
  return (
    input.shortDescription?.trim() ||
    input.description?.trim() ||
    ""
  );
}

/** מינימום לפרסום ציבורי: קטגוריה, אזור, מחיר/חבילה, תמונה, תיאור קצר */
export function getServiceListingReadiness(
  input: ServiceReadinessInput
): ServiceReadiness {
  const checks: ServiceReadinessCheck[] = [
    {
      id: "category",
      label: "קטגוריית שירות",
      done: Boolean(input.category?.trim()),
    },
    {
      id: "serviceArea",
      label: "אזור שירות",
      done: Boolean(input.serviceArea?.trim()),
    },
    {
      id: "price",
      label: "מחיר או חבילה אחת לפחות",
      done: hasPrice(input),
    },
    {
      id: "coverImage",
      label: "תמונה ראשית",
      done: Boolean(input.coverImageUrl?.trim()),
    },
    {
      id: "description",
      label: "תיאור קצר",
      done: descriptionText(input).length >= DESC_MIN,
    },
  ];
  const doneCount = checks.filter((c) => c.done).length;
  const total = checks.length;
  return {
    checks,
    doneCount,
    total,
    percent: Math.round((doneCount / total) * 100),
    ready: doneCount === total,
  };
}

export const SERVICE_INCOMPLETE_MODERATION_NOTE =
  "השלימו קטגוריה, אזור שירות, מחיר/חבילה, תמונה ראשית ותיאור קצר לפני פרסום.";
