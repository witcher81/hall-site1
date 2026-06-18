export type ServiceCustomInclude = {
  label: string;
  checked: boolean;
  /** הסבר קצר על מה שנותנים במסגרת המחיר — אופציונלי */
  description?: string;
};

export type ServicePaidExtraItem = {
  label: string;
  description?: string;
  usePriceRange?: boolean;
  exactPrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
};

export type ServiceIncludesBundle = {
  included: ServiceCustomInclude[];
  paidExtras: ServicePaidExtraItem[];
};

export const MAX_SERVICE_INCLUDE_ITEMS = 50;
const MAX_ITEMS = MAX_SERVICE_INCLUDE_ITEMS;
const MAX_LABEL_LEN = 80;
const MAX_ITEM_DESC_LEN = 280;
const MAX_PRICE = 2_147_483_647;

const EMPTY_BUNDLE: ServiceIncludesBundle = {
  included: [],
  paidExtras: [],
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

function sanitizeIncludedArray(data: unknown): ServiceCustomInclude[] {
  if (!Array.isArray(data)) return [];
  const out: ServiceCustomInclude[] = [];
  for (const item of data) {
    if (out.length >= MAX_ITEMS) break;
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = sliceStr(o.label, MAX_LABEL_LEN);
    if (!label) continue;
    const checked = typeof o.checked === "boolean" ? o.checked : true;
    const description = sliceStr(o.description, MAX_ITEM_DESC_LEN);
    out.push({
      label,
      checked,
      ...(description ? { description } : {}),
    });
  }
  return out;
}

function sanitizePaidExtrasArray(data: unknown): ServicePaidExtraItem[] {
  if (!Array.isArray(data)) return [];
  const out: ServicePaidExtraItem[] = [];
  for (const item of data) {
    if (out.length >= MAX_ITEMS) break;
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = sliceStr(o.label, MAX_LABEL_LEN);
    if (!label) continue;
    const description = sliceStr(o.description, MAX_ITEM_DESC_LEN);
    let usePriceRange = o.usePriceRange === true;
    let exactPrice = toPriceIntOrNull(o.exactPrice);
    let minPrice = toPriceIntOrNull(o.minPrice);
    let maxPrice = toPriceIntOrNull(o.maxPrice);
    if (exactPrice != null) {
      usePriceRange = false;
      minPrice = null;
      maxPrice = null;
    } else if (
      minPrice != null &&
      maxPrice != null &&
      minPrice !== maxPrice
    ) {
      usePriceRange = true;
    } else if (minPrice != null || maxPrice != null) {
      usePriceRange = false;
      exactPrice = minPrice ?? maxPrice;
      minPrice = null;
      maxPrice = null;
    }
    if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
      [minPrice, maxPrice] = [maxPrice, minPrice];
    }
    out.push({
      label,
      ...(description ? { description } : {}),
      ...(usePriceRange ? { usePriceRange: true } : {}),
      ...(exactPrice != null ? { exactPrice } : {}),
      ...(minPrice != null ? { minPrice } : {}),
      ...(maxPrice != null ? { maxPrice } : {}),
    });
  }
  return out;
}

/** נרמול payload מהלקוח (מערך ישן או אובייקט { included, paidExtras }) */
export function sanitizeServiceIncludesBundleFromClient(
  data: unknown
): ServiceIncludesBundle {
  if (Array.isArray(data)) {
    return { included: sanitizeIncludedArray(data), paidExtras: [] };
  }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    const inc = o.included ?? o.customIncludes;
    const paid = o.paidExtras ?? o.paid ?? o.extras;
    return {
      included: sanitizeIncludedArray(inc),
      paidExtras: sanitizePaidExtrasArray(paid),
    };
  }
  return { ...EMPTY_BUNDLE };
}

export function parseServiceIncludesBundle(
  json: string | null | undefined
): ServiceIncludesBundle {
  if (!json) return { ...EMPTY_BUNDLE };
  try {
    const data = JSON.parse(json) as unknown;
    return sanitizeServiceIncludesBundleFromClient(data);
  } catch {
    return { ...EMPTY_BUNDLE };
  }
}

/** תאימות: רק פריטים «כלולים במחיר» (מערך ישן ב־DB) */
export function parseCustomIncludesJson(
  json: string | null | undefined
): ServiceCustomInclude[] {
  return parseServiceIncludesBundle(json).included;
}

export function parsePaidExtrasJson(
  json: string | null | undefined
): ServicePaidExtraItem[] {
  return parseServiceIncludesBundle(json).paidExtras;
}

export function serializeServiceIncludesBundle(
  bundle: ServiceIncludesBundle
): string | null {
  const inc = sanitizeIncludedArray(bundle.included);
  const paid = sanitizePaidExtrasArray(bundle.paidExtras);
  if (inc.length === 0 && paid.length === 0) return null;
  return JSON.stringify({ included: inc, paidExtras: paid });
}

/** @deprecated השתמש ב־serializeServiceIncludesBundle */
export function serializeCustomIncludesJson(
  items: ServiceCustomInclude[]
): string | null {
  return serializeServiceIncludesBundle({
    included: sanitizeIncludedArray(items),
    paidExtras: [],
  });
}

/** @deprecated השתמש ב־sanitizeServiceIncludesBundleFromClient */
export function sanitizeCustomIncludesFromClient(
  data: unknown
): ServiceCustomInclude[] {
  return sanitizeIncludedArray(data);
}

const MAX_INCLUDES_NOTE_LEN = 500;

export function sanitizeIncludesNote(
  s: string | null | undefined
): string | null {
  if (s == null || typeof s !== "string") return null;
  const t = s.trim();
  if (!t) return null;
  return t.slice(0, MAX_INCLUDES_NOTE_LEN);
}

export function hasAnyServiceIncludes(
  includesTravel: boolean,
  includesEquipment: boolean,
  included: ServiceCustomInclude[],
  includesNote?: string | null,
  paidExtras?: ServicePaidExtraItem[]
): boolean {
  const paid = paidExtras ?? [];
  return (
    includesTravel ||
    includesEquipment ||
    included.some((c) => c.checked && c.label.trim().length > 0) ||
    paid.some((p) => p.label.trim().length > 0) ||
    sanitizeIncludesNote(includesNote) != null
  );
}
