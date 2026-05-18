import { storedMinMaxIsPriceRange } from "@/lib/freelancerServicePriceForm";

function parseStoredPrice(raw: unknown): number | null {
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw)
        : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

/** טעינה מ-JSON (מחיר יחיד או טווח) */
export function parseAmenityExtraFromDb(
  extraPrice: unknown,
  extraPriceMax?: unknown
): { min: string; max: string } {
  const minN = parseStoredPrice(extraPrice);
  if (minN == null) return { min: "", max: "" };
  const maxN = parseStoredPrice(extraPriceMax);
  if (maxN != null && maxN !== minN) {
    return { min: String(minN), max: String(maxN) };
  }
  return { min: String(minN), max: String(minN) };
}

export function isValidAmenityExtraPrice(min: string, max: string): boolean {
  const minT = min.trim();
  if (!minT) return false;
  const minN = Number(minT);
  if (!Number.isFinite(minN) || minN <= 0) return false;
  const maxT = max.trim() || minT;
  if (!storedMinMaxIsPriceRange(minT, maxT)) return true;
  const maxN = Number(maxT);
  return Number.isFinite(maxN) && maxN > 0 && minN <= maxN;
}

export function amenityExtraForApiSubmit(
  min: string,
  max: string
): { extraPrice: number; extraPriceMax?: number } | null {
  const minT = min.trim();
  if (!isValidAmenityExtraPrice(minT, max)) return null;
  const minN = Math.trunc(Number(minT));
  const maxT = max.trim() || minT;
  if (storedMinMaxIsPriceRange(minT, maxT)) {
    return { extraPrice: minN, extraPriceMax: Math.trunc(Number(maxT)) };
  }
  return { extraPrice: minN };
}

/** פרסור מחיר תוספת מגוף בקשת API (מספרים) */
export function parseAmenityExtraFromApiRecord(
  o: Record<string, unknown>,
  requireValid: boolean
):
  | { extraPrice: number | null; extraPriceMax?: number }
  | { error: "invalid_price" } {
  const minRaw = o.extraPrice;
  const maxRaw = o.extraPriceMax;
  const minS =
    typeof minRaw === "number"
      ? String(minRaw)
      : typeof minRaw === "string"
        ? minRaw
        : "";
  const maxS =
    typeof maxRaw === "number"
      ? String(maxRaw)
      : typeof maxRaw === "string"
        ? maxRaw
        : minS;
  if (!requireValid) {
    const parsed = amenityExtraForApiSubmit(minS, maxS);
    if (!parsed) return { extraPrice: null };
    return parsed.extraPriceMax != null
      ? { extraPrice: parsed.extraPrice, extraPriceMax: parsed.extraPriceMax }
      : { extraPrice: parsed.extraPrice };
  }
  if (!isValidAmenityExtraPrice(minS, maxS)) {
    return { error: "invalid_price" };
  }
  const parsed = amenityExtraForApiSubmit(minS, maxS)!;
  return parsed.extraPriceMax != null
    ? { extraPrice: parsed.extraPrice, extraPriceMax: parsed.extraPriceMax }
    : { extraPrice: parsed.extraPrice };
}

export function amenityExtraPayloadFields(
  min: string,
  max: string
): { extraPrice: number | null; extraPriceMax?: number } {
  const parsed = amenityExtraForApiSubmit(min, max);
  if (!parsed) return { extraPrice: null };
  if (parsed.extraPriceMax != null) {
    return { extraPrice: parsed.extraPrice, extraPriceMax: parsed.extraPriceMax };
  }
  return { extraPrice: parsed.extraPrice };
}

export function formatAmenityExtraPriceHint(
  extraPrice: number | null,
  extraPriceMax?: number | null
): string {
  if (extraPrice == null || extraPrice <= 0) return "כלול במחיר";
  if (
    extraPriceMax != null &&
    extraPriceMax > 0 &&
    extraPriceMax !== extraPrice
  ) {
    return `בתוספת תשלום · ₪${extraPrice.toLocaleString("he-IL")}–${extraPriceMax.toLocaleString("he-IL")}`;
  }
  return `בתוספת תשלום · ₪${extraPrice.toLocaleString("he-IL")}`;
}
