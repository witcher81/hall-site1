import { parseVenueSoftAttributesFromDb } from "@/lib/venueSoftAttributesJson";

/**
 * רשימת שירותים/תוספים שהאולם מציע — לטופס בקשה (מחפש בוחר מקור לכל פריט).
 */

/** תחילית בשדה label ב-customAmenitiesJson — שירות/פרט חתונה מותאם (טפסי בעל אולם) */
export const WEDDING_AMENITY_STORAGE_PREFIX = "חתונה:";

export type BuiltinServiceKey =
  | "hasFood"
  | "hasDanceFloor"
  | "hasTableSetup"
  | "hasSoundSystem"
  | "hasBridalRoom";

const BUILTIN_SERVICE_KEYS: BuiltinServiceKey[] = [
  "hasFood",
  "hasDanceFloor",
  "hasTableSetup",
  "hasSoundSystem",
  "hasBridalRoom",
];

const BUILTIN_LABELS: Record<BuiltinServiceKey, string> = {
  hasFood: "אוכל",
  hasDanceFloor: "רחבת ריקודים",
  hasTableSetup: "סידור שולחנות",
  hasSoundSystem: "מערכת הגברה",
  hasBridalRoom: "חדר חתן/כלה",
};

export type VenueInquiryAmenitiesInput = {
  hasChuppa?: boolean | null;
  hasChuppaOutdoor?: boolean | null;
  hasChuppaCovered?: boolean | null;
  hasFood?: boolean | null;
  hasDanceFloor?: boolean | null;
  hasTableSetup?: boolean | null;
  hasSoundSystem?: boolean | null;
  hasBridalRoom?: boolean | null;
  customAmenitiesJson?: string | null;
  /** שורות טקסט חופשי (מאפייני אולם ללא תמחור) — רק עם on */
  venueSoftAttributesJson?: string | null;
  /** פרופילים לפי סוג אירוע — customHallItems לפי סוג נבחר */
  eventTypeProfilesJson?: string | null;
};

export type InquiryServiceContext = {
  /** סוג אירוע מהטופס — משפיע על רשימת השירותים (למשל חתונה ללא אוכל) */
  eventType: string | null;
};

/** האם סוג האירוע נחשב חתונה (לפי ערך בשדה הטופס / באולם) */
export function isWeddingInquiryEventType(eventType: string | null | undefined): boolean {
  if (eventType == null || typeof eventType !== "string") return false;
  const t = eventType.trim().toLowerCase();
  return t === "חתונה";
}

type ParsedCustomRow = { label: string; checked: boolean };

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
      out.push({ label, checked: o.checked === true });
    }
    return out;
  } catch {
    return [];
  }
}

function appendChuppaOptionsForInquiry(
  v: VenueInquiryAmenitiesInput,
  wedding: boolean,
  out: { id: string; label: string }[]
) {
  const outdoor = Boolean(v.hasChuppaOutdoor);
  const covered = Boolean(v.hasChuppaCovered);

  if (wedding) {
    if (outdoor) {
      out.push({ id: "service:chuppaOutdoor", label: "חופה בחוץ" });
    }
    if (covered) {
      out.push({ id: "service:chuppaCovered", label: "חופה מקורה" });
    }
  } else if (v.hasChuppa) {
    out.push({ id: "service:chuppa", label: "חופה" });
  }
}

/** מזהים יציבים לפי סדר אותו כמו בפרסור — לשימוש ב־API לאימות */
export function getVenueServiceOptionsForInquiry(
  v: VenueInquiryAmenitiesInput,
  ctx?: InquiryServiceContext
): { id: string; label: string }[] {
  const eventType = ctx?.eventType?.trim() || null;
  const wedding = isWeddingInquiryEventType(eventType);

  const out: { id: string; label: string }[] = [];
  appendChuppaOptionsForInquiry(v, wedding, out);

  for (const key of BUILTIN_SERVICE_KEYS) {
    if (wedding && key === "hasFood") continue;
    if (v[key]) {
      out.push({ id: `service:${key}`, label: BUILTIN_LABELS[key] });
    }
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
      out.push({
        id: `service:weddingCustom:${weddingCustomIdx}`,
        label,
      });
      weddingCustomIdx += 1;
    } else {
      out.push({ id: `service:custom:${generalIdx}`, label: row.label });
      generalIdx += 1;
    }
  }

  const softRows = parseVenueSoftAttributesFromDb(v.venueSoftAttributesJson ?? null);
  let softIdx = 0;
  for (const row of softRows) {
    if (!row.on) continue;
    out.push({ id: `service:soft:${softIdx}`, label: row.label });
    softIdx += 1;
  }

  const etKey = eventType;
  if (etKey && v.eventTypeProfilesJson) {
    try {
      const profiles = JSON.parse(v.eventTypeProfilesJson) as unknown;
      if (typeof profiles === "object" && profiles !== null && !Array.isArray(profiles)) {
        const rawProfile = (profiles as Record<string, unknown>)[etKey];
        if (typeof rawProfile === "object" && rawProfile !== null && !Array.isArray(rawProfile)) {
          const po = rawProfile as Record<string, unknown>;
          const items = po.customHallItems;
          if (Array.isArray(items)) {
            let hallIdx = 0;
            for (const item of items) {
              if (typeof item !== "object" || item === null) continue;
              const o = item as Record<string, unknown>;
              const label = typeof o.label === "string" ? o.label.trim() : "";
              if (!label || o.checked !== true) continue;
              out.push({
                id: `service:eventHallCustom:${hallIdx}`,
                label,
              });
              hallIdx += 1;
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  return out;
}

export type ServiceChoiceSource = "venue" | "external";

export type StoredServiceChoice = {
  id: string;
  label: string;
  source: ServiceChoiceSource;
};

/**
 * לחתונה עם שני סוגי חופה באולם: נשמרת בחירה אחת בלבד, תמיד דרך האולם.
 */
function filterWeddingChuppahExclusiveOptions(
  options: { id: string; label: string }[],
  inquiryEventType: string | null,
  byId: Map<string, ServiceChoiceSource>
): { id: string; label: string }[] {
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
  byId.set("service:chuppaOutdoor", "venue");
  return options.filter((o) => o.id !== "service:chuppaCovered");
}

/** אימות מול רשימת השירותים של האולם — תוויות מהשרת בלבד */
export function normalizeInquiryServiceChoices(
  venue: VenueInquiryAmenitiesInput,
  raw: unknown,
  inquiryEventType: string | null
): StoredServiceChoice[] {
  const options = getVenueServiceOptionsForInquiry(venue, {
    eventType: inquiryEventType,
  });
  if (options.length === 0) return [];
  const allowed = new Map(options.map((o) => [o.id, o]));
  const byId = new Map<string, ServiceChoiceSource>();
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item !== "object" || item === null) continue;
      const o = item as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : "";
      const source = o.source;
      if (!allowed.has(id)) continue;
      if (source !== "venue" && source !== "external") continue;
      byId.set(id, source);
    }
  }
  const filtered = filterWeddingChuppahExclusiveOptions(
    options,
    inquiryEventType,
    byId
  );
  return filtered.map((o) => ({
    id: o.id,
    label: o.label,
    source:
      o.id === "service:chuppaOutdoor" || o.id === "service:chuppaCovered"
        ? "venue"
        : (byId.get(o.id) ?? "venue"),
  }));
}
