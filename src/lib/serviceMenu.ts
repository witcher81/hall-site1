import { FOOD_BEVERAGE_PRIMARY } from "@/lib/freelancerServiceCategories";
import { parseServiceCategorySelections } from "@/lib/freelancerServiceCategories";

export type ServiceMenuItemPricing =
  | "included"
  | "per_guest"
  | "fixed"
  | "per_guest_range";

export type ServiceMenuItem = {
  id: string;
  label: string;
  description?: string;
  pricing: ServiceMenuItemPricing;
  exactPrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  usePriceRange?: boolean;
};

export type ServiceMenuSection = {
  id: string;
  title: string;
  items: ServiceMenuItem[];
};

export type ServiceMenuPackage = {
  id: string;
  name: string;
  description?: string;
  usePerGuestRange?: boolean;
  perGuestPrice?: number | null;
  perGuestMin?: number | null;
  perGuestMax?: number | null;
};

export type ServiceMenuConfig = {
  minGuests: number | null;
  maxGuests: number | null;
  minOrderAmountNis?: number | null;
  menuNote?: string;
  packages: ServiceMenuPackage[];
  sections: ServiceMenuSection[];
};

export const MAX_MENU_SECTIONS = 20;
export const MAX_MENU_ITEMS_PER_SECTION = 50;
export const MAX_MENU_PACKAGES = 12;
const MAX_LABEL = 80;
const MAX_DESC = 280;
const MAX_NOTE = 500;
const MAX_PRICE = 2_147_483_647;

const EMPTY_MENU: ServiceMenuConfig = {
  minGuests: null,
  maxGuests: null,
  packages: [],
  sections: [],
};

function sliceStr(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

function toPriceIntOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const t = Math.trunc(n);
  if (t < 0 || t > MAX_PRICE) return null;
  return t;
}

function toGuestIntOrNull(v: unknown): number | null {
  const n = toPriceIntOrNull(v);
  if (n == null || n < 1) return null;
  return n;
}

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sanitizeMenuItem(raw: unknown): ServiceMenuItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const label = sliceStr(o.label, MAX_LABEL);
  if (!label) return null;
  const pricing = o.pricing;
  const validPricing: ServiceMenuItemPricing[] = [
    "included",
    "per_guest",
    "fixed",
    "per_guest_range",
  ];
  const pricingMode = validPricing.includes(pricing as ServiceMenuItemPricing)
    ? (pricing as ServiceMenuItemPricing)
    : "included";
  const description = sliceStr(o.description, MAX_DESC);
  let usePriceRange = o.usePriceRange === true;
  let exactPrice = toPriceIntOrNull(o.exactPrice);
  let minPrice = toPriceIntOrNull(o.minPrice);
  let maxPrice = toPriceIntOrNull(o.maxPrice);

  if (pricingMode === "per_guest_range" || pricingMode === "fixed") {
    usePriceRange = pricingMode === "per_guest_range" || usePriceRange;
  } else if (pricingMode === "per_guest") {
    usePriceRange = false;
    if (exactPrice == null && minPrice != null) exactPrice = minPrice;
  } else {
    usePriceRange = false;
    exactPrice = null;
    minPrice = null;
    maxPrice = null;
  }

  const id =
    typeof o.id === "string" && o.id.trim()
      ? o.id.trim().slice(0, 64)
      : newId("item");

  return {
    id,
    label,
    ...(description ? { description } : {}),
    pricing: pricingMode,
    ...(pricingMode !== "included" && usePriceRange
      ? { usePriceRange: true, minPrice, maxPrice }
      : {}),
    ...(pricingMode !== "included" && !usePriceRange && exactPrice != null
      ? { exactPrice }
      : {}),
  };
}

function sanitizeSection(raw: unknown): ServiceMenuSection | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = sliceStr(o.title, MAX_LABEL);
  if (!title) return null;
  const items: ServiceMenuItem[] = [];
  if (Array.isArray(o.items)) {
    for (const item of o.items) {
      if (items.length >= MAX_MENU_ITEMS_PER_SECTION) break;
      const parsed = sanitizeMenuItem(item);
      if (parsed) items.push(parsed);
    }
  }
  const id =
    typeof o.id === "string" && o.id.trim()
      ? o.id.trim().slice(0, 64)
      : newId("sec");
  return { id, title, items };
}

function sanitizePackage(raw: unknown): ServiceMenuPackage | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = sliceStr(o.name, MAX_LABEL);
  if (!name) return null;
  const description = sliceStr(o.description, MAX_DESC);
  const usePerGuestRange = o.usePerGuestRange === true;
  const perGuestPrice = toPriceIntOrNull(o.perGuestPrice);
  const perGuestMin = toPriceIntOrNull(o.perGuestMin);
  const perGuestMax = toPriceIntOrNull(o.perGuestMax);
  const id =
    typeof o.id === "string" && o.id.trim()
      ? o.id.trim().slice(0, 64)
      : newId("pkg");

  return {
    id,
    name,
    ...(description ? { description } : {}),
    ...(usePerGuestRange
      ? { usePerGuestRange: true, perGuestMin, perGuestMax }
      : { perGuestPrice }),
  };
}

export function sanitizeServiceMenuFromClient(data: unknown): ServiceMenuConfig {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ...EMPTY_MENU };
  }
  const o = data as Record<string, unknown>;
  const minGuests = toGuestIntOrNull(o.minGuests);
  const maxGuests = toGuestIntOrNull(o.maxGuests);
  const minOrderAmountNis = toPriceIntOrNull(o.minOrderAmountNis);
  const menuNote = sliceStr(o.menuNote, MAX_NOTE);

  const packages: ServiceMenuPackage[] = [];
  if (Array.isArray(o.packages)) {
    for (const p of o.packages) {
      if (packages.length >= MAX_MENU_PACKAGES) break;
      const parsed = sanitizePackage(p);
      if (parsed) packages.push(parsed);
    }
  }

  const sections: ServiceMenuSection[] = [];
  if (Array.isArray(o.sections)) {
    for (const s of o.sections) {
      if (sections.length >= MAX_MENU_SECTIONS) break;
      const parsed = sanitizeSection(s);
      if (parsed) sections.push(parsed);
    }
  }

  return {
    minGuests,
    maxGuests:
      maxGuests != null && minGuests != null && maxGuests < minGuests
        ? minGuests
        : maxGuests,
    ...(minOrderAmountNis != null ? { minOrderAmountNis } : {}),
    ...(menuNote ? { menuNote } : {}),
    packages,
    sections,
  };
}

export function parseServiceMenuJson(
  json: string | null | undefined
): ServiceMenuConfig {
  if (!json) return { ...EMPTY_MENU };
  try {
    return sanitizeServiceMenuFromClient(JSON.parse(json) as unknown);
  } catch {
    return { ...EMPTY_MENU };
  }
}

export function serializeServiceMenuJson(menu: ServiceMenuConfig): string | null {
  const clean = sanitizeServiceMenuFromClient(menu);
  const hasContent =
    clean.minGuests != null ||
    clean.maxGuests != null ||
    clean.menuNote ||
    clean.minOrderAmountNis != null ||
    clean.packages.length > 0 ||
    clean.sections.some((s) => s.items.length > 0 || s.title);

  if (!hasContent) return null;
  return JSON.stringify(clean);
}

export function isFoodServiceCategory(category: string | null | undefined): boolean {
  if (!category?.trim()) return false;
  const { primary } = parseServiceCategorySelections(category);
  return primary === FOOD_BEVERAGE_PRIMARY;
}

export function menuHasContent(menu: ServiceMenuConfig): boolean {
  return serializeServiceMenuJson(menu) != null;
}

export function validateServiceMenuForSubmit(menu: ServiceMenuConfig): string | null {
  const m = sanitizeServiceMenuFromClient(menu);
  if (m.minGuests == null) {
    return "נא לציין מינימום אורחים שהשירות משרת";
  }
  if (m.maxGuests == null) {
    return "נא לציין מקסימום אורחים שהשירות משרת";
  }
  if (m.maxGuests < m.minGuests) {
    return "מקסימום האורחים חייב להיות גדול או שווה למינימום";
  }
  const hasPackages = m.packages.length > 0;
  const hasMenuItems = m.sections.some((s) => s.items.length > 0);
  if (!hasPackages && !hasMenuItems) {
    return "הוסיפו לפחות חבילה אחת או מנות בתפריט";
  }
  for (const pkg of m.packages) {
    if (pkg.usePerGuestRange) {
      if (pkg.perGuestMin == null && pkg.perGuestMax == null) {
        return `לחבילה «${pkg.name}» חסר מחיר לאורח`;
      }
    } else if (pkg.perGuestPrice == null) {
      return `לחבילה «${pkg.name}» חסר מחיר לאורח`;
    }
  }
  return null;
}

export function validateMenuGuestCount(
  menu: ServiceMenuConfig,
  guestCount: number | null
): string | null {
  if (guestCount == null || !Number.isFinite(guestCount) || guestCount < 1) {
    return "נא לציין מספר אורחים";
  }
  const g = Math.trunc(guestCount);
  if (menu.minGuests != null && g < menu.minGuests) {
    return `מספר האורחים נמוך מהמינימום (${menu.minGuests})`;
  }
  if (menu.maxGuests != null && g > menu.maxGuests) {
    return `מספר האורחים גבוה מהמקסימום (${menu.maxGuests})`;
  }
  return null;
}

export function formatMenuItemPrice(item: ServiceMenuItem): string | null {
  if (item.pricing === "included") return "כלול בחבילה";
  if (item.usePriceRange || item.pricing === "per_guest_range") {
    const min = item.minPrice;
    const max = item.maxPrice;
    if (min != null && max != null && min !== max) return `₪${min}–${max} לאורח`;
    if (min != null) return `מ-₪${min} לאורח`;
    if (max != null) return `עד ₪${max} לאורח`;
    return null;
  }
  const p = item.exactPrice ?? item.minPrice;
  if (p == null) return null;
  if (item.pricing === "per_guest") return `₪${p} לאורח`;
  if (item.pricing === "fixed") return `₪${p}`;
  return `₪${p}`;
}

export function formatPackagePerGuest(pkg: ServiceMenuPackage): string | null {
  if (pkg.usePerGuestRange) {
    const min = pkg.perGuestMin;
    const max = pkg.perGuestMax;
    if (min != null && max != null && min !== max) return `₪${min}–${max} לאורח`;
    if (min != null) return `מ-₪${min} לאורח`;
    if (max != null) return `עד ₪${max} לאורח`;
    return null;
  }
  if (pkg.perGuestPrice != null) return `₪${pkg.perGuestPrice} לאורח`;
  return null;
}

export function estimatePackageTotal(
  pkg: ServiceMenuPackage,
  guestCount: number
): { min: number | null; max: number | null } {
  const g = Math.max(1, Math.trunc(guestCount));
  if (pkg.usePerGuestRange) {
    const min =
      pkg.perGuestMin != null ? pkg.perGuestMin * g : null;
    const max =
      pkg.perGuestMax != null ? pkg.perGuestMax * g : min;
    return { min, max };
  }
  if (pkg.perGuestPrice != null) {
    const t = pkg.perGuestPrice * g;
    return { min: t, max: t };
  }
  return { min: null, max: null };
}

/** מחירי שירות (minPrice/maxPrice) לפי חבילות — להצגה בכרטיס */
export function deriveServicePricesFromMenu(menu: ServiceMenuConfig): {
  minPrice: number | null;
  maxPrice: number | null;
} {
  const perGuest: number[] = [];
  for (const pkg of menu.packages) {
    if (pkg.usePerGuestRange) {
      if (pkg.perGuestMin != null) perGuest.push(pkg.perGuestMin);
      if (pkg.perGuestMax != null) perGuest.push(pkg.perGuestMax);
    } else if (pkg.perGuestPrice != null) {
      perGuest.push(pkg.perGuestPrice);
    }
  }
  if (perGuest.length === 0) return { minPrice: null, maxPrice: null };
  return {
    minPrice: Math.min(...perGuest),
    maxPrice: Math.max(...perGuest),
  };
}

export function createEmptyMenuSection(title = ""): ServiceMenuSection {
  return { id: newId("sec"), title, items: [] };
}

export function createEmptyMenuPackage(name = ""): ServiceMenuPackage {
  return { id: newId("pkg"), name, perGuestPrice: null };
}

export function createEmptyMenuItem(label = ""): ServiceMenuItem {
  return {
    id: newId("item"),
    label,
    pricing: "included",
  };
}
