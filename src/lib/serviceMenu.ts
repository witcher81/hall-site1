import { parseServiceCategorySelections } from "@/lib/freelancerServiceCategories";
import {
  resolveCatalogTemplateFromCategory,
  serviceUsesCatalogEditor,
  type CatalogTemplate,
  type CatalogTemplateId,
} from "@/lib/serviceCategoryTemplates";

export type ServiceMenuItemPricing =
  | "included"
  | "per_guest"
  | "fixed"
  | "per_guest_range"
  | "per_unit"
  | "per_hour";

export type ServiceQuantityTier = {
  id: string;
  minQty: number;
  maxQty?: number | null;
  pricePerUnit: number | null;
};

export type ServiceDeliverable = {
  id: string;
  label: string;
  value: string;
};

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
  durationHours?: number | null;
};

export type ServiceMenuConfig = {
  templateId?: CatalogTemplateId | null;
  minGuests: number | null;
  maxGuests: number | null;
  minPersons?: number | null;
  maxPersons?: number | null;
  minOrderAmountNis?: number | null;
  menuNote?: string;
  packages: ServiceMenuPackage[];
  sections: ServiceMenuSection[];
  quantityTiers?: ServiceQuantityTier[];
  deliverables?: ServiceDeliverable[];
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
    "per_unit",
    "per_hour",
  ];
  const pricingMode = validPricing.includes(pricing as ServiceMenuItemPricing)
    ? (pricing as ServiceMenuItemPricing)
    : "included";
  const description = sliceStr(o.description, MAX_DESC);
  let usePriceRange = o.usePriceRange === true;
  let exactPrice = toPriceIntOrNull(o.exactPrice);
  let minPrice = toPriceIntOrNull(o.minPrice);
  let maxPrice = toPriceIntOrNull(o.maxPrice);

  if (pricingMode === "per_guest_range") {
    usePriceRange = true;
  } else if (pricingMode === "fixed" && usePriceRange) {
    usePriceRange = true;
  } else if (pricingMode === "per_guest") {
    usePriceRange = false;
    if (exactPrice == null && minPrice != null) exactPrice = minPrice;
  } else if (
    pricingMode === "fixed" ||
    pricingMode === "per_unit" ||
    pricingMode === "per_hour"
  ) {
    usePriceRange = false;
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
  const durationHours = toPriceIntOrNull(o.durationHours);
  const id =
    typeof o.id === "string" && o.id.trim()
      ? o.id.trim().slice(0, 64)
      : newId("pkg");

  return {
    id,
    name,
    ...(description ? { description } : {}),
    ...(durationHours != null ? { durationHours } : {}),
    ...(usePerGuestRange
      ? { usePerGuestRange: true, perGuestMin, perGuestMax }
      : { perGuestPrice }),
  };
}

function sanitizeQuantityTier(raw: unknown): ServiceQuantityTier | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const minQty = toGuestIntOrNull(o.minQty);
  if (minQty == null) return null;
  const maxQty = toGuestIntOrNull(o.maxQty);
  const pricePerUnit = toPriceIntOrNull(o.pricePerUnit);
  const id =
    typeof o.id === "string" && o.id.trim()
      ? o.id.trim().slice(0, 64)
      : newId("tier");
  return {
    id,
    minQty,
    ...(maxQty != null ? { maxQty } : {}),
    pricePerUnit,
  };
}

function sanitizeDeliverable(raw: unknown): ServiceDeliverable | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const label = sliceStr(o.label, MAX_LABEL);
  const value = sliceStr(o.value, 120);
  if (!label) return null;
  const id =
    typeof o.id === "string" && o.id.trim()
      ? o.id.trim().slice(0, 64)
      : newId("del");
  return { id, label, value };
}

export function sanitizeServiceMenuFromClient(data: unknown): ServiceMenuConfig {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ...EMPTY_MENU };
  }
  const o = data as Record<string, unknown>;
  const templateId =
    typeof o.templateId === "string" &&
    o.templateId.trim()
      ? (o.templateId.trim() as CatalogTemplateId)
      : null;
  const minGuests = toGuestIntOrNull(o.minGuests);
  const maxGuests = toGuestIntOrNull(o.maxGuests);
  const minPersons = toGuestIntOrNull(o.minPersons);
  const maxPersons = toGuestIntOrNull(o.maxPersons);
  const minOrderAmountNis = toPriceIntOrNull(o.minOrderAmountNis);
  const menuNote = sliceStr(o.menuNote ?? o.catalogNote, MAX_NOTE);

  const quantityTiers: ServiceQuantityTier[] = [];
  if (Array.isArray(o.quantityTiers)) {
    for (const t of o.quantityTiers) {
      if (quantityTiers.length >= 20) break;
      const parsed = sanitizeQuantityTier(t);
      if (parsed) quantityTiers.push(parsed);
    }
  }

  const deliverables: ServiceDeliverable[] = [];
  if (Array.isArray(o.deliverables)) {
    for (const d of o.deliverables) {
      if (deliverables.length >= 30) break;
      const parsed = sanitizeDeliverable(d);
      if (parsed) deliverables.push(parsed);
    }
  }

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
    ...(templateId ? { templateId } : {}),
    minGuests,
    maxGuests:
      maxGuests != null && minGuests != null && maxGuests < minGuests
        ? minGuests
        : maxGuests,
    ...(minPersons != null ? { minPersons } : {}),
    ...(maxPersons != null &&
    minPersons != null &&
    maxPersons < minPersons
      ? { maxPersons: minPersons }
      : maxPersons != null
        ? { maxPersons }
        : {}),
    ...(minOrderAmountNis != null ? { minOrderAmountNis } : {}),
    ...(menuNote ? { menuNote } : {}),
    packages,
    sections,
    ...(quantityTiers.length > 0 ? { quantityTiers } : {}),
    ...(deliverables.length > 0 ? { deliverables } : {}),
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
    clean.templateId ||
    clean.minGuests != null ||
    clean.maxGuests != null ||
    clean.minPersons != null ||
    clean.maxPersons != null ||
    clean.menuNote ||
    clean.minOrderAmountNis != null ||
    clean.packages.length > 0 ||
    clean.sections.some((s) => s.items.length > 0 || s.title) ||
    (clean.quantityTiers?.length ?? 0) > 0 ||
    (clean.deliverables?.length ?? 0) > 0;

  if (!hasContent) return null;
  return JSON.stringify(clean);
}

export { serviceUsesCatalogEditor };

/** @deprecated השתמש ב-serviceUsesCatalogEditor */
export function isFoodServiceCategory(category: string | null | undefined): boolean {
  return serviceUsesCatalogEditor(category);
}

export function menuHasContent(menu: ServiceMenuConfig): boolean {
  return serializeServiceMenuJson(menu) != null;
}

function catalogCapacityRequired(template: CatalogTemplate): boolean {
  return template.minCapacityLabel.includes("*");
}

export function validateServiceMenuForSubmit(
  menu: ServiceMenuConfig,
  template?: CatalogTemplate | null
): string | null {
  const m = sanitizeServiceMenuFromClient(menu);
  const t = template ?? null;

  if (t && catalogCapacityRequired(t)) {
    if (t.showPersonCapacity) {
      if (m.minPersons == null) return `נא לציין ${t.minCapacityLabel.replace(/\s*\*$/, "")}`;
      if (m.maxPersons == null) return `נא לציין ${t.maxCapacityLabel.replace(/\s*\*$/, "")}`;
      if (m.maxPersons < m.minPersons) {
        return "מקסימום חייב להיות גדול או שווה למינימום";
      }
    } else if (t.showGuestCapacity) {
      if (m.minGuests == null) return `נא לציין ${t.minCapacityLabel.replace(/\s*\*$/, "")}`;
      if (m.maxGuests == null) return `נא לציין ${t.maxCapacityLabel.replace(/\s*\*$/, "")}`;
      if (m.maxGuests < m.minGuests) {
        return "מקסימום חייב להיות גדול או שווה למינימום";
      }
    }
  }

  const hasPackages = m.packages.length > 0;
  const hasItems = m.sections.some((s) => s.items.length > 0);
  const hasTiers = (m.quantityTiers?.length ?? 0) > 0;
  if (!hasPackages && !hasItems && !hasTiers) {
    return "הוסיפו לפחות חבילה אחת, פריט בקטלוג או מדרגת כמות";
  }

  for (const pkg of m.packages) {
    if (pkg.usePerGuestRange) {
      if (pkg.perGuestMin == null && pkg.perGuestMax == null) {
        return `לחבילה «${pkg.name}» חסר מחיר`;
      }
    } else if (pkg.perGuestPrice == null) {
      return `לחבילה «${pkg.name}» חסר מחיר`;
    }
  }
  return null;
}

export function validateCatalogInquiry(
  menu: ServiceMenuConfig,
  template: CatalogTemplate | null,
  input: {
    guestCount?: number | null;
    personCount?: number | null;
    quantity?: number | null;
  }
): string | null {
  if (!template) return null;
  const m = sanitizeServiceMenuFromClient(menu);
  if (template.requireGuestCountInquiry) {
    return validateMenuGuestCount(m, input.guestCount ?? null);
  }
  if (template.requirePersonCountInquiry) {
    const c = input.personCount ?? null;
    if (c == null || !Number.isFinite(c) || c < 1) return "נא לציין מספר אנשים";
    const n = Math.trunc(c);
    if (m.minPersons != null && n < m.minPersons) {
      return `מספר האנשים נמוך מהמינימום (${m.minPersons})`;
    }
    if (m.maxPersons != null && n > m.maxPersons) {
      return `מספר האנשים גבוה מהמקסימום (${m.maxPersons})`;
    }
    return null;
  }
  if (template.requireQuantityInquiry) {
    const q = input.quantity ?? null;
    if (q == null || !Number.isFinite(q) || q < 1) return "נא לציין כמות";
    const n = Math.trunc(q);
    if (m.minGuests != null && n < m.minGuests) {
      return `הכמות נמוכה מהמינימום (${m.minGuests})`;
    }
    if (m.maxGuests != null && n > m.maxGuests) {
      return `הכמות גבוהה מהמקסימום (${m.maxGuests})`;
    }
    return null;
  }
  return null;
}

export function ensureMenuTemplateId(
  menu: ServiceMenuConfig,
  category: string | null | undefined
): ServiceMenuConfig {
  const t = resolveCatalogTemplateFromCategory(category);
  if (!t) return menu;
  return { ...menu, templateId: t.id };
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
  if (item.pricing === "per_unit") return `₪${p} ליחידה`;
  if (item.pricing === "per_hour") return `₪${p} לשעה`;
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

export function catalogPackageUsesPerGuestMultiplier(
  template: CatalogTemplate | null | undefined
): boolean {
  if (!template) return true;
  return /לאורח|לאדם|למשתתף/.test(template.packagePriceLabel);
}

export function estimatePackageTotal(
  pkg: ServiceMenuPackage,
  count: number,
  multiplyByCount = true
): { min: number | null; max: number | null } {
  const g = Math.max(1, Math.trunc(count));
  if (pkg.usePerGuestRange) {
    const min = pkg.perGuestMin != null ? pkg.perGuestMin * (multiplyByCount ? g : 1) : null;
    const max =
      pkg.perGuestMax != null
        ? pkg.perGuestMax * (multiplyByCount ? g : 1)
        : min;
    return { min, max };
  }
  if (pkg.perGuestPrice != null) {
    const t = pkg.perGuestPrice * (multiplyByCount ? g : 1);
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

export function createEmptyQuantityTier(): ServiceQuantityTier {
  return { id: newId("tier"), minQty: 1, pricePerUnit: null };
}

export function createEmptyDeliverable(): ServiceDeliverable {
  return { id: newId("del"), label: "", value: "" };
}
