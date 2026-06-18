/** סוגי שדות לחבילת אירוע (EventPackage) */

export const PACKAGE_TIERS = ["basic", "standard", "premium"] as const;
export type PackageTier = (typeof PACKAGE_TIERS)[number];

export const PACKAGE_TIER_LABELS: Record<PackageTier, string> = {
  basic: "בסיס",
  standard: "משודרג",
  premium: "פרימיום",
};

export const SERVICE_SLOT_MODES = ["included", "recommended", "optional"] as const;
export type ServiceSlotMode = (typeof SERVICE_SLOT_MODES)[number];

export const SERVICE_SLOT_MODE_LABELS: Record<ServiceSlotMode, string> = {
  included: "כלול בחבילה",
  recommended: "מומלץ",
  optional: "אופציונלי",
};

export type EventPackageVenueInclude = {
  venueOptionId: string;
};

export type EventPackageServiceSlot = {
  role: string;
  mode: ServiceSlotMode;
  serviceId?: number;
  allowAlternatives?: boolean;
};

export function parsePackageTier(raw: unknown): PackageTier | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toLowerCase();
  return PACKAGE_TIERS.includes(t as PackageTier) ? (t as PackageTier) : null;
}

export function parseEventTypesJson(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function serializeEventTypesJson(types: string[]): string | null {
  const list = types.map((t) => t.trim()).filter(Boolean);
  return list.length > 0 ? JSON.stringify(list) : null;
}

export function parseVenueIncludesJson(
  raw: string | null | undefined
): EventPackageVenueInclude[] {
  if (!raw?.trim()) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    const out: EventPackageVenueInclude[] = [];
    for (const row of arr) {
      if (typeof row !== "object" || row === null) continue;
      const id = (row as { venueOptionId?: unknown }).venueOptionId;
      if (typeof id === "string" && id.trim()) {
        out.push({ venueOptionId: id.trim() });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function serializeVenueIncludesJson(
  items: EventPackageVenueInclude[]
): string | null {
  const list = items.filter((i) => i.venueOptionId.trim());
  return list.length > 0 ? JSON.stringify(list) : null;
}

export function parseServiceSlotsJson(
  raw: string | null | undefined
): EventPackageServiceSlot[] {
  if (!raw?.trim()) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    const out: EventPackageServiceSlot[] = [];
    for (const row of arr) {
      if (typeof row !== "object" || row === null) continue;
      const o = row as Record<string, unknown>;
      const role = typeof o.role === "string" ? o.role.trim() : "";
      if (!role) continue;
      const modeRaw = typeof o.mode === "string" ? o.mode.trim().toLowerCase() : "recommended";
      const mode = SERVICE_SLOT_MODES.includes(modeRaw as ServiceSlotMode)
        ? (modeRaw as ServiceSlotMode)
        : "recommended";
      const serviceId =
        typeof o.serviceId === "number" && Number.isInteger(o.serviceId) && o.serviceId > 0
          ? o.serviceId
          : undefined;
      out.push({
        role,
        mode,
        serviceId,
        allowAlternatives: o.allowAlternatives === true,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function serializeServiceSlotsJson(
  slots: EventPackageServiceSlot[]
): string | null {
  const list = slots.filter((s) => s.role.trim());
  return list.length > 0 ? JSON.stringify(list) : null;
}
