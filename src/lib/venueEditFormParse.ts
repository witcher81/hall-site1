import { parseAmenityExtraFromDb } from "@/lib/amenityExtraPrice";
import { findStoredEventTypeProfileKey } from "@/lib/eventTypeOptions";
import { WEDDING_AMENITY_STORAGE_PREFIX as WEDDING_CUSTOM_PREFIX } from "@/lib/venueInquiryAmenities";
import { parseMealAlternativesFromProfile } from "@/lib/venueMealAlternatives";
import {
  parseSeekerExternalFromRecord,
  parseSeekerExternalEventTypesFromRecord,
  resolveSeekerExternalForCustomRow,
} from "@/lib/venueAmenitySeekerExternal";

export type VenueEditPriceMode = "included" | "extra";

export type VenueEditCustomHallRow = {
  label: string;
  checked: boolean;
  priceMode: VenueEditPriceMode;
  extraPrice: string;
  extraPriceMax: string;
  allowsSeekerExternal: boolean;
  allowsSeekerExternalEventTypes: string[];
};

export const EVENT_TYPE_PUBLIC_NOTES_MAX = 800;

export type VenueEditEventTypeProfile = {
  minGuests: string;
  maxGuests: string;
  hasFoodAtEvent: boolean;
  minPrice: string;
  maxPrice: string;
  /** אפשרויות/שינויים במנה — למשל טבעוני, צמחוני */
  mealAlternatives: string[];
  /** כשיש אוכל גלובלי — סימון שמחיר המנה לסוג זה שונה מהמחיר הכללי */
  overrideMealPrice: boolean;
  /** הערות למחפשים בדף האולם — אופציונלי */
  publicNotes: string;
  customHallRows: VenueEditCustomHallRow[];
};

export function trimEventTypePublicNotes(raw: string): string {
  return raw.trim().slice(0, EVENT_TYPE_PUBLIC_NOTES_MAX);
}

function parsePublicNotesFromProfile(profile: Record<string, unknown>): string {
  if (typeof profile.publicNotes !== "string") return "";
  return trimEventTypePublicNotes(profile.publicNotes);
}

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
      const { min, max } = parseAmenityExtraFromDb(o.extraPrice, o.extraPriceMax);
      out.push({
        label,
        checked: o.checked === true,
        priceMode: o.priceMode === "extra" ? "extra" : "included",
        extraPrice: min,
        extraPriceMax: max,
        allowsSeekerExternal: resolveSeekerExternalForCustomRow(
          parseSeekerExternalFromRecord(o)
        ),
        allowsSeekerExternalEventTypes: parseSeekerExternalEventTypesFromRecord(o),
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
          extraPriceMax: row.extraPriceMax,
          allowsSeekerExternal: row.allowsSeekerExternal,
          allowsSeekerExternalEventTypes: row.allowsSeekerExternalEventTypes,
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
    const { min, max } = parseAmenityExtraFromDb(o.extraPrice, o.extraPriceMax);
    out.push({
      label,
      checked: o.checked === true,
      priceMode: o.priceMode === "extra" ? "extra" : "included",
      extraPrice: min,
      extraPriceMax: max,
      allowsSeekerExternal: resolveSeekerExternalForCustomRow(
        parseSeekerExternalFromRecord(o)
      ),
      allowsSeekerExternalEventTypes: [],
    });
  }
  return out;
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
  _fallbackVegan: boolean
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
      mealAlternatives: [],
      overrideMealPrice: false,
      publicNotes: "",
      customHallRows: [],
    };
  }
  if (!raw) return out;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return out;
    const obj = parsed as Record<string, unknown>;
    const storedKeys = Object.keys(obj);
    for (const et of safeTypes) {
      const profileKey = findStoredEventTypeProfileKey(et, storedKeys);
      if (!profileKey) continue;
      const row = obj[profileKey];
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
      const mealAlternatives = parseMealAlternativesFromProfile(profile);
      const overrideMealPrice = minP !== "" || maxP !== "";
      const customHallRows = parseCustomHallItemsFromProfileJson(profile);
      if (et === "חתונה") {
        out[et] = {
          minGuests: profile.minGuests == null ? "" : String(profile.minGuests),
          maxGuests: profile.maxGuests == null ? "" : String(profile.maxGuests),
          hasFoodAtEvent: true,
          minPrice: minP,
          maxPrice: maxP,
          mealAlternatives,
          overrideMealPrice,
          publicNotes: parsePublicNotesFromProfile(profile),
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
        mealAlternatives: hasFoodAtEvent ? mealAlternatives : [],
        overrideMealPrice: hasFoodAtEvent ? overrideMealPrice : false,
        publicNotes: parsePublicNotesFromProfile(profile),
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
