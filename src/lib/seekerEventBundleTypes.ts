/** פריט בחבילת אירוע אישית (נשמר ב־itemsJson) */
export type SeekerBundleItem = {
  id: string;
  slotKey: string;
  label: string;
  kind: "venue_hall" | "venue_included" | "venue_extra" | "marketplace";
  venueOptionId?: string;
  serviceId?: number;
  serviceName?: string;
  source: "venue" | "external";
  priceFrom: number | null;
  priceTo: number | null;
  note?: string;
};

export type SeekerBundleBuildMode = "manual" | "auto";
export type SeekerBundleStatus = "draft" | "ready";

export function parseBundleItemsJson(raw: string | null | undefined): SeekerBundleItem[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: SeekerBundleItem[] = [];
    for (const row of parsed) {
      if (typeof row !== "object" || row === null) continue;
      const o = row as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : "";
      const label = typeof o.label === "string" ? o.label.trim() : "";
      if (!id || !label) continue;
      const kind = o.kind;
      if (
        kind !== "venue_hall" &&
        kind !== "venue_included" &&
        kind !== "venue_extra" &&
        kind !== "marketplace"
      ) {
        continue;
      }
      const source = o.source === "external" ? "external" : "venue";
      out.push({
        id,
        slotKey: typeof o.slotKey === "string" ? o.slotKey : id,
        label,
        kind,
        venueOptionId:
          typeof o.venueOptionId === "string" ? o.venueOptionId : undefined,
        serviceId:
          typeof o.serviceId === "number" && Number.isInteger(o.serviceId) && o.serviceId > 0
            ? o.serviceId
            : undefined,
        serviceName:
          typeof o.serviceName === "string" ? o.serviceName.trim() || undefined : undefined,
        source,
        priceFrom:
          typeof o.priceFrom === "number" && Number.isFinite(o.priceFrom)
            ? Math.trunc(o.priceFrom)
            : null,
        priceTo:
          typeof o.priceTo === "number" && Number.isFinite(o.priceTo)
            ? Math.trunc(o.priceTo)
            : null,
        note: typeof o.note === "string" ? o.note.trim() || undefined : undefined,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function serializeBundleItems(items: SeekerBundleItem[]): string {
  return JSON.stringify(items);
}

export function newBundleItemId(): string {
  return `bi_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function estimateBundleTotal(items: SeekerBundleItem[]): {
  from: number;
  to: number;
  pricedCount: number;
} {
  let from = 0;
  let to = 0;
  let pricedCount = 0;
  for (const it of items) {
    if (it.priceFrom != null && it.priceFrom > 0) {
      from += it.priceFrom;
      pricedCount += 1;
    }
    if (it.priceTo != null && it.priceTo > 0) {
      to += it.priceTo;
    } else if (it.priceFrom != null && it.priceFrom > 0) {
      to += it.priceFrom;
    }
  }
  return { from, to: Math.max(from, to), pricedCount };
}
