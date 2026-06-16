import type { InquiryAddonFreelancerPick } from "@/lib/inquiryAddonFreelancers";
import type { InquiryVenueOptionReplacement } from "@/lib/inquiryVenueOptionReplacement";

export type InquiryLinkedSupplier = {
  serviceId: number;
  name: string;
  providerName: string;
  source: "addon" | "replacement";
};

const MAX_SUPPLIER_IDS = 20;

export function buildInquiryLinkedSuppliers(input: {
  addonFreelancers: InquiryAddonFreelancerPick[];
  replacementByOptionId: Record<string, InquiryVenueOptionReplacement>;
}): InquiryLinkedSupplier[] {
  const map = new Map<number, InquiryLinkedSupplier>();

  for (const r of Object.values(input.replacementByOptionId)) {
    map.set(r.serviceId, {
      serviceId: r.serviceId,
      name: r.name,
      providerName: r.providerName,
      source: "replacement",
    });
  }
  for (const f of input.addonFreelancers) {
    map.set(f.serviceId, {
      serviceId: f.serviceId,
      name: f.name,
      providerName: f.providerName,
      source: "addon",
    });
  }

  return [...map.values()];
}

/** מזהי ספקים לשליחת הודעה — null = כל המקושרים (ברירת מחדל ישנה) */
export function parseSupplierServiceIds(raw: unknown): number[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return [];
  const ids: number[] = [];
  for (const item of raw) {
    const n = typeof item === "number" ? item : Number(item);
    if (!Number.isInteger(n) || n <= 0 || ids.includes(n)) continue;
    ids.push(n);
    if (ids.length >= MAX_SUPPLIER_IDS) break;
  }
  return ids;
}

export function filterSupplierIdsToLinked(
  requested: number[] | null,
  linkedIds: number[]
): number[] {
  const linked = new Set(linkedIds);
  if (requested === null) return linkedIds;
  return requested.filter((id) => linked.has(id));
}
