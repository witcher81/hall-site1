import type { InquiryDealServiceRow } from "@/lib/inquiryDealInsights";
import type { StoredServiceChoice } from "@/lib/venueInquiryAmenities";

export type InquiryVenueOptionReplacement = {
  serviceId: number;
  name: string;
  providerName: string;
  minPrice: number | null;
  maxPrice: number | null;
};

export function replacementFromDealRow(
  row: InquiryDealServiceRow
): InquiryVenueOptionReplacement {
  return {
    serviceId: row.id,
    name: row.name,
    providerName:
      row.provider.businessName?.trim() || row.provider.name?.trim() || "ספק",
    minPrice: row.minPrice,
    maxPrice: row.maxPrice,
  };
}

function parseRawReplacementFields(
  raw: unknown
): Map<
  string,
  {
    marketplaceServiceId?: number;
    replacementName?: string;
    replacementProvider?: string;
  }
> {
  const map = new Map<
    string,
    {
      marketplaceServiceId?: number;
      replacementName?: string;
      replacementProvider?: string;
    }
  >();
  if (!Array.isArray(raw)) return map;
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : "";
    if (!id) continue;
    const sid =
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
    if (sid || replacementName || replacementProvider) {
      map.set(id, {
        marketplaceServiceId: sid,
        replacementName: replacementName || undefined,
        replacementProvider: replacementProvider || undefined,
      });
    }
  }
  return map;
}

/** מצרף שמות חלופה מאומתים מ-DB לשורות שנשמרו בפנייה */
export async function enrichInquiryServiceChoicesWithReplacements(
  rows: StoredServiceChoice[],
  raw: unknown,
  loadServices: (ids: number[]) => Promise<
    Array<{
      id: number;
      name: string;
      provider: { name: string | null; businessName: string | null };
    }>
  >
): Promise<StoredServiceChoice[]> {
  const rawById = parseRawReplacementFields(raw);
  if (rawById.size === 0) return rows;

  const serviceIds = [
    ...new Set(
      rows
        .map((row) => {
          const raw = rawById.get(row.id);
          return raw?.marketplaceServiceId;
        })
        .filter((id): id is number => typeof id === "number" && id > 0)
    ),
  ];
  const loaded =
    serviceIds.length > 0 ? await loadServices(serviceIds) : [];
  const byServiceId = new Map(loaded.map((s) => [s.id, s]));

  return rows.map((row) => {
    const rawFields = rawById.get(row.id);
    if (row.source !== "external" || !rawFields?.marketplaceServiceId) return row;
    const svc = byServiceId.get(rawFields.marketplaceServiceId);
    if (!svc) {
      return { ...row, source: "venue" as const };
    }
    return {
      ...row,
      marketplaceServiceId: svc.id,
      replacementName: svc.name.trim() || rawFields.replacementName,
      replacementProvider:
        svc.provider.businessName?.trim() ||
        svc.provider.name?.trim() ||
        rawFields.replacementProvider,
    };
  });
}
