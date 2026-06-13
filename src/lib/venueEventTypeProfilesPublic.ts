/**
 * פרופיל לפי סוג אירוע — לתצוגה ציבורית בדף אולם (מחפש לוחץ על סוג אירוע).
 */

import {
  parseSeekerExternalFromRecord,
  resolveSeekerExternalForCustomRow,
} from "@/lib/venueAmenitySeekerExternal";
import { trimEventTypePublicNotes } from "@/lib/venueEditFormParse";
import { parseMealAlternativesFromProfile } from "@/lib/venueMealAlternatives";

export type PublicEventHallItem = {
  label: string;
  checked: boolean;
  priceMode: "included" | "extra";
  extraPrice: number | null;
  extraPriceMax?: number | null;
  allowsSeekerExternalSource: boolean;
};

export type PublicEventTypeProfile = {
  minGuests: number | null;
  maxGuests: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  hasFoodAtEvent: boolean;
  mealAlternatives: string[];
  /** הערות בעל האולם למחפשים — אופציונלי */
  publicNotes: string | null;
  customHallItems: PublicEventHallItem[];
};

function toInt(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function boolFood(v: unknown): boolean {
  return v === true || v === "true";
}

function parseCustomHallItems(raw: unknown): PublicEventHallItem[] {
  if (!Array.isArray(raw)) return [];
  const out: PublicEventHallItem[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    if (!label) continue;
    const priceMode = o.priceMode === "extra" ? "extra" : "included";
    let extraPrice: number | null = null;
    let extraPriceMax: number | null = null;
    if (priceMode === "extra" && typeof o.extraPrice === "number" && Number.isFinite(o.extraPrice)) {
      extraPrice = Math.trunc(o.extraPrice);
      if (
        typeof o.extraPriceMax === "number" &&
        Number.isFinite(o.extraPriceMax) &&
        Math.trunc(o.extraPriceMax) !== extraPrice
      ) {
        extraPriceMax = Math.trunc(o.extraPriceMax);
      }
    }
    out.push({
      label,
      checked: o.checked === true,
      priceMode,
      extraPrice,
      ...(extraPriceMax != null ? { extraPriceMax } : {}),
      allowsSeekerExternalSource: resolveSeekerExternalForCustomRow(
        parseSeekerExternalFromRecord(o),
        false
      ),
    });
  }
  return out;
}

function parseOneProfile(o: Record<string, unknown>, et: string): PublicEventTypeProfile {
  const isWedding = et === "חתונה";
  const minGuests = toInt(o.minGuests);
  const maxGuests = toInt(o.maxGuests);
  let minPrice = toInt(o.minPrice);
  let maxPrice = toInt(o.maxPrice);

  let hasFoodAtEvent = isWedding;
  if (!isWedding) {
    if (o.hasFoodAtEvent === false || o.hasFoodAtEvent === "false") {
      hasFoodAtEvent = false;
    } else {
      hasFoodAtEvent = boolFood(o.hasFoodAtEvent);
    }
  }

  if (!hasFoodAtEvent) {
    minPrice = null;
    maxPrice = null;
  }

  const mealAlternatives = parseMealAlternativesFromProfile(o);

  const notesRaw = typeof o.publicNotes === "string" ? o.publicNotes : "";
  const publicNotes = notesRaw.trim() ? trimEventTypePublicNotes(notesRaw) : null;

  return {
    minGuests,
    maxGuests,
    minPrice,
    maxPrice,
    hasFoodAtEvent,
    mealAlternatives,
    publicNotes,
    customHallItems: parseCustomHallItems(o.customHallItems),
  };
}

function emptyProfile(et: string): PublicEventTypeProfile {
  const isWedding = et === "חתונה";
  return {
    minGuests: null,
    maxGuests: null,
    minPrice: null,
    maxPrice: null,
    hasFoodAtEvent: isWedding,
    mealAlternatives: [],
    publicNotes: null,
    customHallItems: [],
  };
}

export function parseVenueEventTypeProfilesForPublic(
  raw: string | null | undefined,
  eventTypes: string[]
): Record<string, PublicEventTypeProfile> {
  const out: Record<string, PublicEventTypeProfile> = {};
  for (const et of eventTypes) {
    out[et] = emptyProfile(et);
  }
  if (!raw || typeof raw !== "string" || raw.trim() === "") return out;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return out;
    const obj = parsed as Record<string, unknown>;
    for (const et of eventTypes) {
      const row = obj[et];
      if (typeof row !== "object" || row === null || Array.isArray(row)) continue;
      out[et] = parseOneProfile(row as Record<string, unknown>, et);
    }
  } catch {
    return out;
  }
  return out;
}
