import { WEDDING_AMENITY_STORAGE_PREFIX as WEDDING_CUSTOM_PREFIX } from "@/lib/venueInquiryAmenities";
import {
  defaultSeekerExternalForCustomRow,
  parseSeekerExternalFromRecord,
  resolveSeekerExternalForCustomRow,
} from "@/lib/venueAmenitySeekerExternal";

export type VenueEditPriceMode = "included" | "extra";

export type VenueEditCustomHallRow = {
  label: string;
  checked: boolean;
  priceMode: VenueEditPriceMode;
  extraPrice: string;
  allowsSeekerExternal: boolean;
};

export type VenueEditEventTypeProfile = {
  minGuests: string;
  maxGuests: string;
  hasFoodAtEvent: boolean;
  minPrice: string;
  maxPrice: string;
  hasVeganFood: boolean;
  veganSameAsMealPrice: boolean;
  veganMinPrice: string;
  veganMaxPrice: string;
  customHallRows: VenueEditCustomHallRow[];
};

export function parseEventTypesList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0
    );
  } catch {
    return [];
  }
}

export function parseGalleryImageUrlsList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0
    );
  } catch {
    return [];
  }
}

export function parseCustomAmenitiesFromDb(
  raw: string | null | undefined
): VenueEditCustomHallRow[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    const out: VenueEditCustomHallRow[] = [];
    const seen = new Set<string>();
    for (const item of v) {
      if (out.length >= 20) break;
      if (typeof item !== "object" || item === null) continue;
      const o = item as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label.trim() : "";
      if (!label || label.length > 80) continue;
      const k = label.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({
        label,
        checked: o.checked === true,
        priceMode: o.priceMode === "extra" ? "extra" : "included",
        extraPrice:
          typeof o.extraPrice === "number" && Number.isFinite(o.extraPrice)
            ? String(Math.trunc(o.extraPrice))
            : "",
        allowsSeekerExternal: resolveSeekerExternalForCustomRow(
          parseSeekerExternalFromRecord(o)
        ),
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function splitWeddingAmenities(rows: VenueEditCustomHallRow[]) {
  const general: VenueEditCustomHallRow[] = [];
  const wedding: VenueEditCustomHallRow[] = [];
  for (const row of rows) {
    if (row.label.startsWith("__builtin__:")) continue;
    if (row.label.startsWith(WEDDING_CUSTOM_PREFIX)) {
      const normalized = row.label.slice(WEDDING_CUSTOM_PREFIX.length).trim();
      if (normalized) {
        wedding.push({
          label: normalized,
          checked: row.checked,
          priceMode: row.priceMode,
          extraPrice: row.extraPrice,
          allowsSeekerExternal: row.allowsSeekerExternal,
        });
      }
      continue;
    }
    general.push(row);
  }
  return { general, wedding };
}

function parseCustomHallItemsFromProfileJson(
  profile: Record<string, unknown>
): VenueEditCustomHallRow[] {
  const raw = profile.customHallItems ?? profile.customHallRows;
  if (!Array.isArray(raw)) return [];
  const out: VenueEditCustomHallRow[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (out.length >= 20) break;
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    if (!label || label.length > 80) continue;
    const k = label.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({
      label,
      checked: o.checked === true,
      priceMode: o.priceMode === "extra" ? "extra" : "included",
      extraPrice:
        typeof o.extraPrice === "number" && Number.isFinite(o.extraPrice)
          ? String(Math.trunc(o.extraPrice))
          : "",
      allowsSeekerExternal: resolveSeekerExternalForCustomRow(
        parseSeekerExternalFromRecord(o)
      ),
    });
  }
  return out;
}

function inferVeganSameAsMealPrice(profile: Record<string, unknown>): boolean {
  if (profile.veganSameAsMealPrice === true || profile.veganSameAsMealPrice === "true") {
    return true;
  }
  if (profile.veganSameAsMealPrice === false || profile.veganSameAsMealPrice === "false") {
    return false;
  }
  const minP =
    profile.minPrice == null || profile.minPrice === "" ? null : Number(profile.minPrice);
  const maxP =
    profile.maxPrice == null || profile.maxPrice === "" ? null : Number(profile.maxPrice);
  const vMin =
    profile.veganMinPrice == null || profile.veganMinPrice === ""
      ? null
      : Number(profile.veganMinPrice);
  const vMax =
    profile.veganMaxPrice == null || profile.veganMaxPrice === ""
      ? null
      : Number(profile.veganMaxPrice);
  if (vMin == null && vMax == null) return true;
  if (
    minP != null &&
    maxP != null &&
    vMin != null &&
    vMax != null &&
    minP === vMin &&
    maxP === vMax
  ) {
    return true;
  }
  return false;
}

export function mergeLegacyWeddingIntoWeddingProfile(
  profiles: Record<string, VenueEditEventTypeProfile>,
  weddingLegacy: VenueEditCustomHallRow[]
) {
  const p = profiles["חתונה"];
  if (!p || weddingLegacy.length === 0) return;
  const rows = Array.isArray(p.customHallRows) ? p.customHallRows : [];
  p.customHallRows = [...rows];
  const seen = new Set(p.customHallRows.map((r) => r.label.toLowerCase()));
  for (const w of weddingLegacy) {
    const k = w.label.toLowerCase();
    if (!seen.has(k)) {
      p.customHallRows.push({ ...w });
      seen.add(k);
    }
  }
}

export function parseEventTypeProfilesForForm(
  raw: string | null | undefined,
  eventTypes: string[],
  fallbackVegan: boolean
): Record<string, VenueEditEventTypeProfile> {
  const safeTypes = Array.isArray(eventTypes)
    ? eventTypes.filter((e): e is string => typeof e === "string")
    : [];
  const out: Record<string, VenueEditEventTypeProfile> = {};
  for (const et of safeTypes) {
    out[et] = {
      minGuests: "",
      maxGuests: "",
      hasFoodAtEvent: et === "חתונה",
      minPrice: "",
      maxPrice: "",
      hasVeganFood: fallbackVegan,
      veganSameAsMealPrice: true,
      veganMinPrice: "",
      veganMaxPrice: "",
      customHallRows: [],
    };
  }
  if (!raw) return out;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return out;
    const obj = parsed as Record<string, unknown>;
    const boolVegan = (profile: Record<string, unknown>) =>
      "hasVeganFood" in profile
        ? profile.hasVeganFood === true || profile.hasVeganFood === "true"
        : fallbackVegan;
    for (const et of safeTypes) {
      const row = obj[et];
      if (typeof row !== "object" || row === null || Array.isArray(row)) continue;
      const profile = row as Record<string, unknown>;
      const minP =
        profile.minPrice == null || profile.minPrice === ""
          ? ""
          : String(profile.minPrice);
      const maxP =
        profile.maxPrice == null || profile.maxPrice === ""
          ? ""
          : String(profile.maxPrice);
      const veganMinP =
        profile.veganMinPrice == null || profile.veganMinPrice === ""
          ? ""
          : String(profile.veganMinPrice);
      const veganMaxP =
        profile.veganMaxPrice == null || profile.veganMaxPrice === ""
          ? ""
          : String(profile.veganMaxPrice);
      const veganSameAs = inferVeganSameAsMealPrice(profile);
      const customHallRows = parseCustomHallItemsFromProfileJson(profile);
      if (et === "חתונה") {
        out[et] = {
          minGuests: profile.minGuests == null ? "" : String(profile.minGuests),
          maxGuests: profile.maxGuests == null ? "" : String(profile.maxGuests),
          hasFoodAtEvent: true,
          minPrice: minP,
          maxPrice: maxP,
          hasVeganFood: boolVegan(profile),
          veganSameAsMealPrice: veganSameAs,
          veganMinPrice: veganSameAs ? "" : veganMinP,
          veganMaxPrice: veganSameAs ? "" : veganMaxP,
          customHallRows,
        };
        continue;
      }
      const legacyFood =
        profile.nonWeddingFoodMode === "required" ||
        profile.nonWeddingFoodMode === "optional";
      let hasFoodAtEvent =
        profile.hasFoodAtEvent === true || profile.hasFoodAtEvent === "true";
      if (profile.hasFoodAtEvent === false || profile.hasFoodAtEvent === "false") {
        hasFoodAtEvent = false;
      } else if (!("hasFoodAtEvent" in profile)) {
        hasFoodAtEvent = legacyFood || minP !== "" || maxP !== "";
      }
      out[et] = {
        minGuests: profile.minGuests == null ? "" : String(profile.minGuests),
        maxGuests: profile.maxGuests == null ? "" : String(profile.maxGuests),
        hasFoodAtEvent,
        minPrice: hasFoodAtEvent ? minP : "",
        maxPrice: hasFoodAtEvent ? maxP : "",
        hasVeganFood: boolVegan(profile),
        veganSameAsMealPrice: hasFoodAtEvent ? veganSameAs : true,
        veganMinPrice: hasFoodAtEvent && !veganSameAs ? veganMinP : "",
        veganMaxPrice: hasFoodAtEvent && !veganSameAs ? veganMaxP : "",
        customHallRows,
      };
    }
  } catch {
    return out;
  }
  return out;
}

export function buildEventTypeProfilesForEdit(
  profilesJson: string | null | undefined,
  eventTypes: string[],
  fallbackVegan: boolean,
  customAmenitiesJson: string | null | undefined
): Record<string, VenueEditEventTypeProfile> {
  const base = parseEventTypeProfilesForForm(profilesJson, eventTypes, fallbackVegan);
  const weddingLegacy = splitWeddingAmenities(
    parseCustomAmenitiesFromDb(customAmenitiesJson)
  ).wedding;
  mergeLegacyWeddingIntoWeddingProfile(base, weddingLegacy);
  return base;
}
