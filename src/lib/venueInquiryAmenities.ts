import { formatAmenityExtraPriceHint } from "@/lib/amenityExtraPrice";
import { parseVenueSoftAttributesFromDb } from "@/lib/venueSoftAttributesJson";
import { parseVenueEventTypeProfilesForPublic } from "@/lib/venueEventTypeProfilesPublic";
import { parseEventTypesList } from "@/lib/venueEditFormParse";
import type { BuiltinAmenityKeyFull } from "@/lib/venueBuiltinAmenities";
import {
  BUILTIN_FIXED_VENUE_ONLY_KEYS,
  parseSeekerExternalFromRecord,
  resolveSeekerExternalForBuiltin,
  resolveSeekerExternalForCustomRow,
  parseSeekerExternalEventTypesFromRecord,
  allowsSeekerExternalForInquiryEvent,
} from "@/lib/venueAmenitySeekerExternal";
import { eventTypesListIncludes } from "@/lib/eventTypeOptions";

/**
 * רשימת שירותים/תוספים שהאולם מציע — לטופס בקשה (מחפש בוחר מקור לכל פריט).
 * מיושר עם מודל יצירה/עריכת אולם: תמחור __builtin__, פרופילים לפי סוג אירוע, מאפיינים רכים ללא בחירה.
 */

export const WEDDING_AMENITY_STORAGE_PREFIX = "חתונה:";

export type BuiltinServiceKey = BuiltinAmenityKeyFull;

const BUILTIN_SERVICE_KEYS: BuiltinServiceKey[] = [
  "hasFood",
  "hasTableSetup",
  "hasSoundSystem",
  "hasAcumLicense",
];

const BUILTIN_LABELS: Record<BuiltinServiceKey, string> = {
  hasFood: "בופה",
  hasTableSetup: "סידור שולחנות",
  hasSoundSystem: "מערכת הגברה",
  hasAcumLicense: 'רישיון אקו"ם',
};

export type VenueInquiryAmenitiesInput = {
  hasChuppa?: boolean | null;
  hasChuppaOutdoor?: boolean | null;
  hasChuppaCovered?: boolean | null;
  hasFood?: boolean | null;
  hasDanceFloor?: boolean | null;
  hasTableSetup?: boolean | null;
  hasSoundSystem?: boolean | null;
  hasAcumLicense?: boolean | null;
  customAmenitiesJson?: string | null;
  venueSoftAttributesJson?: string | null;
  eventTypeProfilesJson?: string | null;
  /** JSON מחרוזת eventTypes — לאימות סוג אירוע ב-API */
  eventTypes?: string | null;
};

export type InquiryServiceContext = {
  eventType: string | null;
};

export type InquiryServiceOption = {
  id: string;
  label: string;
  priceMode: "included" | "extra";
  extraPrice: number | null;
  extraPriceMax?: number | null;
  /**
   * false = חלק מהאולם / לא ניתן להביא ספק חיצוני (רחבה, חופה, פריטי «מה יש באולם»).
   * true = אפשר לבחור דרך האולם או ספק חיצוני (למשל אוכל, הגברה, תוספת כללית).
   */
  allowsExternalSource: boolean;
};

export function inquiryServiceAllowsExternalSource(opt: {
  id: string;
  allowsExternalSource?: boolean;
  priceMode?: "included" | "extra";
}): boolean {
  if (typeof opt.allowsExternalSource === "boolean") return opt.allowsExternalSource;
  if (opt.id.startsWith("service:chuppa")) return false;
  const builtin = opt.id.replace(/^service:/, "") as BuiltinServiceKey;
  if (BUILTIN_FIXED_VENUE_ONLY_KEYS.has(builtin) && opt.priceMode !== "extra") {
    return false;
  }
  return false;
}

/** מאפיינים רכים (נוף לים, בוטיק…) — מידע בלבד, לא בחירת מקור */
export type InquiryInfoTrait = {
  id: string;
  label: string;
};

export type InquiryOptionsBundle = {
  services: InquiryServiceOption[];
  infoTraits: InquiryInfoTrait[];
};

export function isWeddingInquiryEventType(eventType: string | null | undefined): boolean {
  if (eventType == null || typeof eventType !== "string") return false;
  return eventType.trim().toLowerCase() === "חתונה";
}

function isChuppahInquiryOption(opt: InquiryServiceOption): boolean {
  if (opt.id.startsWith("service:chuppa")) return true;
  const label = opt.label.trim();
  return label === "חופה" || label.startsWith("חופה ");
}

type ParsedCustomRow = {
  label: string;
  checked: boolean;
  priceMode: "included" | "extra";
  extraPrice: number | null;
  extraPriceMax: number | null;
  allowsSeekerExternal: boolean;
  seekerExternalEventTypes: string[];
};

function parseCustomAmenitiesJson(json: string | null | undefined): ParsedCustomRow[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json) as unknown;
    if (!Array.isArray(v)) return [];
    const out: ParsedCustomRow[] = [];
    for (const item of v) {
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
      const storedExternal = parseSeekerExternalFromRecord(o);
      let allowsSeekerExternal: boolean;
      if (label.startsWith("__builtin__:")) {
        const bKey = label.slice("__builtin__:".length) as BuiltinServiceKey;
        allowsSeekerExternal = BUILTIN_SERVICE_KEYS.includes(bKey)
          ? resolveSeekerExternalForBuiltin(bKey, storedExternal, priceMode)
          : false;
      } else {
        allowsSeekerExternal = resolveSeekerExternalForCustomRow(storedExternal, false);
      }
      out.push({
        label,
        checked: o.checked === true,
        priceMode,
        extraPrice,
        extraPriceMax,
        allowsSeekerExternal,
        seekerExternalEventTypes: parseSeekerExternalEventTypesFromRecord(o),
      });
    }
    return out;
  } catch {
    return [];
  }
}

type BuiltinState = {
  checked: boolean;
  priceMode: "included" | "extra";
  extraPrice: number | null;
  extraPriceMax: number | null;
  allowsSeekerExternal: boolean;
  seekerExternalEventTypes: string[];
};

function parseBuiltinStates(
  json: string | null | undefined
): Partial<Record<BuiltinServiceKey, BuiltinState>> {
  const out: Partial<Record<BuiltinServiceKey, BuiltinState>> = {};
  for (const row of parseCustomAmenitiesJson(json)) {
    if (!row.label.startsWith("__builtin__:")) continue;
    const key = row.label.slice("__builtin__:".length) as BuiltinServiceKey;
    if (!BUILTIN_SERVICE_KEYS.includes(key)) continue;
    out[key] = {
      checked: row.checked,
      priceMode: row.priceMode,
      extraPrice: row.extraPrice,
      extraPriceMax: row.extraPriceMax,
      allowsSeekerExternal: row.allowsSeekerExternal,
      seekerExternalEventTypes: row.seekerExternalEventTypes,
    };
  }
  return out;
}

function isBuiltinOffered(
  v: VenueInquiryAmenitiesInput,
  key: BuiltinServiceKey,
  builtinStates: Partial<Record<BuiltinServiceKey, BuiltinState>>
): boolean {
  const fromJson = builtinStates[key];
  if (fromJson) return fromJson.checked;
  return Boolean(v[key]);
}

function eventTypeHasFood(
  v: VenueInquiryAmenitiesInput,
  eventType: string | null
): boolean {
  if (isWeddingInquiryEventType(eventType)) return true;
  const et = eventType?.trim();
  if (!et || !v.eventTypeProfilesJson) return Boolean(v.hasFood);
  const types = et ? [et] : [];
  const profiles = parseVenueEventTypeProfilesForPublic(v.eventTypeProfilesJson, types);
  const profile = profiles[et];
  if (profile) return profile.hasFoodAtEvent;
  return Boolean(v.hasFood);
}

function appendChuppaOptionsForInquiry(
  v: VenueInquiryAmenitiesInput,
  wedding: boolean,
  out: InquiryServiceOption[]
) {
  const outdoor = Boolean(v.hasChuppaOutdoor);
  const covered = Boolean(v.hasChuppaCovered);

  if (wedding) {
    if (outdoor) {
      out.push({
        id: "service:chuppaOutdoor",
        label: "חופה בחוץ",
        priceMode: "included",
        extraPrice: null,
        allowsExternalSource: false,
      });
    }
    if (covered) {
      out.push({
        id: "service:chuppaCovered",
        label: "חופה מקורה",
        priceMode: "included",
        extraPrice: null,
        allowsExternalSource: false,
      });
    }
  }
  /* חופה מוצגת רק בחתונה — לא מציגים hasChuppa גנרי לסוגי אירוע אחרים */
}

function pushBuiltinOption(
  out: InquiryServiceOption[],
  key: BuiltinServiceKey,
  state: BuiltinState | undefined,
  inquiryEventType: string | null
) {
  const master =
    state?.allowsSeekerExternal ??
    resolveSeekerExternalForBuiltin(key, undefined, state?.priceMode ?? "included");
  out.push({
    id: `service:${key}`,
    label: BUILTIN_LABELS[key],
    priceMode: state?.priceMode ?? "included",
    extraPrice: state?.extraPrice ?? null,
    extraPriceMax: state?.extraPriceMax ?? null,
    allowsExternalSource: allowsSeekerExternalForInquiryEvent(
      master,
      state?.seekerExternalEventTypes,
      inquiryEventType
    ),
  });
}

/** מזהים יציבים + תמחור — לטופס ול-API */
export function getVenueInquiryOptions(
  v: VenueInquiryAmenitiesInput,
  ctx?: InquiryServiceContext
): InquiryOptionsBundle {
  const eventType = ctx?.eventType?.trim() || null;
  const wedding = isWeddingInquiryEventType(eventType);
  const builtinStates = parseBuiltinStates(v.customAmenitiesJson);
  const services: InquiryServiceOption[] = [];
  const infoTraits: InquiryInfoTrait[] = [];

  appendChuppaOptionsForInquiry(v, wedding, services);

  if (v.hasDanceFloor) {
    infoTraits.push({ id: "trait:hasDanceFloor", label: "רחבת ריקודים" });
  }

  const showFood = eventTypeHasFood(v, eventType);
  for (const key of BUILTIN_SERVICE_KEYS) {
    if (key === "hasFood") {
      if (!showFood) continue;
      if (!isBuiltinOffered(v, key, builtinStates) && !Boolean(v.hasFood)) continue;
    } else if (!isBuiltinOffered(v, key, builtinStates)) {
      continue;
    }
    pushBuiltinOption(services, key, builtinStates[key], eventType);
  }

  const rawCustoms = parseCustomAmenitiesJson(v.customAmenitiesJson).filter(
    (row) => row.checked && !row.label.startsWith("__builtin__:")
  );
  let generalIdx = 0;
  let weddingCustomIdx = 0;
  for (const row of rawCustoms) {
    if (row.label.startsWith(WEDDING_AMENITY_STORAGE_PREFIX)) {
      if (!wedding) continue;
      const label = row.label.slice(WEDDING_AMENITY_STORAGE_PREFIX.length).trim();
      if (!label) continue;
      services.push({
        id: `service:weddingCustom:${weddingCustomIdx}`,
        label,
        priceMode: row.priceMode,
        extraPrice: row.extraPrice,
        extraPriceMax: row.extraPriceMax,
        allowsExternalSource: allowsSeekerExternalForInquiryEvent(
          row.allowsSeekerExternal,
          row.seekerExternalEventTypes,
          eventType
        ),
      });
      weddingCustomIdx += 1;
    } else {
      services.push({
        id: `service:custom:${generalIdx}`,
        label: row.label,
        priceMode: row.priceMode,
        extraPrice: row.extraPrice,
        extraPriceMax: row.extraPriceMax,
        allowsExternalSource: allowsSeekerExternalForInquiryEvent(
          row.allowsSeekerExternal,
          row.seekerExternalEventTypes,
          eventType
        ),
      });
      generalIdx += 1;
    }
  }

  const softRows = parseVenueSoftAttributesFromDb(v.venueSoftAttributesJson ?? null);
  let softIdx = 0;
  for (const row of softRows) {
    if (!row.on) continue;
    infoTraits.push({ id: `info:soft:${softIdx}`, label: row.label });
    softIdx += 1;
  }

  if (eventType && v.eventTypeProfilesJson) {
    const profiles = parseVenueEventTypeProfilesForPublic(v.eventTypeProfilesJson, [eventType]);
    const profile = profiles[eventType];
    if (profile) {
      let hallIdx = 0;
      for (const item of profile.customHallItems) {
        if (!item.checked) continue;
        services.push({
          id: `service:eventHallCustom:${hallIdx}`,
          label: item.label,
          priceMode: item.priceMode,
          extraPrice: item.extraPrice,
          extraPriceMax: item.extraPriceMax ?? null,
          allowsExternalSource: item.allowsSeekerExternalSource ?? false,
        });
        hallIdx += 1;
      }
    }
  }

  const finalServices = wedding
    ? services
    : services.filter((o) => !isChuppahInquiryOption(o));

  return { services: finalServices, infoTraits };
}

/** תאימות לאחור */
export function getVenueServiceOptionsForInquiry(
  v: VenueInquiryAmenitiesInput,
  ctx?: InquiryServiceContext
): { id: string; label: string }[] {
  return getVenueInquiryOptions(v, ctx).services.map((s) => ({
    id: s.id,
    label: s.label,
  }));
}

export type ServiceChoiceSource = "venue" | "external";

export type StoredServiceChoice = {
  id: string;
  label: string;
  source: ServiceChoiceSource;
  priceMode?: "included" | "extra";
  extraPrice?: number | null;
  extraPriceMax?: number | null;
  marketplaceServiceId?: number;
  replacementName?: string;
  replacementProvider?: string;
  /** תוספות בתשלום שנבחרו מספק במאגר */
  paidExtrasSelected?: Array<{
    label: string;
    description?: string;
    exactPrice?: number | null;
    minPrice?: number | null;
    maxPrice?: number | null;
  }>;
};

type ParsedChoiceInput = {
  source: ServiceChoiceSource;
  marketplaceServiceId?: number;
  replacementName?: string;
  replacementProvider?: string;
};

function filterWeddingChuppahExclusiveOptions(
  options: InquiryServiceOption[],
  inquiryEventType: string | null,
  byId: Map<string, ParsedChoiceInput>
): InquiryServiceOption[] {
  if (!isWeddingInquiryEventType(inquiryEventType)) return options;
  const outdoor = options.some((o) => o.id === "service:chuppaOutdoor");
  const covered = options.some((o) => o.id === "service:chuppaCovered");
  if (!outdoor || !covered) return options;

  const hasO = byId.has("service:chuppaOutdoor");
  const hasC = byId.has("service:chuppaCovered");

  if (hasO && !hasC) {
    return options.filter((o) => o.id !== "service:chuppaCovered");
  }
  if (hasC && !hasO) {
    return options.filter((o) => o.id !== "service:chuppaOutdoor");
  }
  if (hasO && hasC) {
    byId.delete("service:chuppaCovered");
    return options.filter((o) => o.id !== "service:chuppaCovered");
  }
  byId.set("service:chuppaOutdoor", { source: "venue" });
  return options.filter((o) => o.id !== "service:chuppaCovered");
}

export function normalizeInquiryServiceChoices(
  venue: VenueInquiryAmenitiesInput,
  raw: unknown,
  inquiryEventType: string | null
): StoredServiceChoice[] {
  const { services: options } = getVenueInquiryOptions(venue, {
    eventType: inquiryEventType,
  });
  if (options.length === 0) return [];
  const allowed = new Map(options.map((o) => [o.id, o]));
  const byId = new Map<string, ParsedChoiceInput>();
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item !== "object" || item === null) continue;
      const o = item as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : "";
      const source = o.source;
      if (!allowed.has(id)) continue;
      if (source !== "venue" && source !== "external") continue;
      const marketplaceServiceId =
        typeof o.marketplaceServiceId === "number" &&
        Number.isInteger(o.marketplaceServiceId) &&
        o.marketplaceServiceId > 0
          ? o.marketplaceServiceId
          : undefined;
      const replacementName =
        typeof o.replacementName === "string" ? o.replacementName.trim() : undefined;
      const replacementProvider =
        typeof o.replacementProvider === "string"
          ? o.replacementProvider.trim()
          : undefined;
      byId.set(id, {
        source,
        marketplaceServiceId,
        replacementName: replacementName || undefined,
        replacementProvider: replacementProvider || undefined,
      });
    }
  }
  const filtered = filterWeddingChuppahExclusiveOptions(
    options,
    inquiryEventType,
    byId
  );
  return filtered
    .filter((o) => {
      if (o.priceMode === "extra") return byId.has(o.id);
      return true;
    })
    .map((o) => {
    const choice = byId.get(o.id);
    const source =
      !inquiryServiceAllowsExternalSource(o) ||
      o.id === "service:chuppaOutdoor" ||
      o.id === "service:chuppaCovered"
        ? "venue"
        : (choice?.source ?? "venue");
    return {
      id: o.id,
      label: o.label,
      source,
      priceMode: o.priceMode,
      extraPrice: o.extraPrice,
      extraPriceMax: o.extraPriceMax,
      ...(source === "external" && choice?.marketplaceServiceId
        ? {
            marketplaceServiceId: choice.marketplaceServiceId,
            replacementName: choice.replacementName,
            replacementProvider: choice.replacementProvider,
          }
        : {}),
    };
  });
}

export function formatInquiryPriceHint(
  priceMode: "included" | "extra",
  extraPrice: number | null,
  extraPriceMax?: number | null
): string {
  if (priceMode === "extra") {
    return formatAmenityExtraPriceHint(extraPrice, extraPriceMax);
  }
  return "כלול במחיר";
}

/** טווח אורחים לפי סוג אירוע (פרופיל) עם נפילה לערכי האולם הכלליים */
export function getInquiryGuestBounds(
  venue: {
    minGuests: number | null;
    maxGuests: number | null;
    eventTypeProfilesJson?: string | null;
  },
  eventType: string | null
): { min: number | null; max: number | null } {
  const et = eventType?.trim();
  if (et && venue.eventTypeProfilesJson) {
    const profiles = parseVenueEventTypeProfilesForPublic(venue.eventTypeProfilesJson, [et]);
    const p = profiles[et];
    if (p) {
      return {
        min: p.minGuests ?? venue.minGuests,
        max: p.maxGuests ?? venue.maxGuests,
      };
    }
  }
  return { min: venue.minGuests, max: venue.maxGuests };
}

export function validateInquiryEventType(
  venueEventTypesJson: string | null | undefined,
  eventType: string | null
): string | null {
  const allowed = parseEventTypesList(venueEventTypesJson ?? null);
  if (allowed.length === 0) return null;
  const et = eventType?.trim();
  if (!et) return null;
  if (!eventTypesListIncludes(allowed, et)) {
    return "סוג האירוע שנבחר אינו מתאים לאולם זה.";
  }
  return null;
}
