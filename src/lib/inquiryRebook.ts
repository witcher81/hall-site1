import type { InquiryAddonFreelancerPick } from "@/lib/inquiryAddonFreelancers";
import type { InquiryDraft } from "@/lib/inquiryDraft";
import { parseStoredSupplierMessagesJson } from "@/lib/inquirySupplierMessages";
import type { InquiryVenueOptionReplacement } from "@/lib/inquiryVenueOptionReplacement";
import { buildInquiryLinkedSuppliers } from "@/lib/inquiryLinkedSuppliers";
import type { ServiceChoiceSource } from "@/lib/venueInquiryAmenities";

export type InquiryRebookSnapshot = {
  preferredDate: string | null;
  guestCount: number | null;
  eventType: string | null;
  message: string;
  serviceChoicesJson: string | null;
  supplierMessagesJson: string | null;
};

type ParsedServiceRow = {
  id?: string;
  label?: string;
  source?: string;
  priceMode?: string;
  extraPrice?: number | null;
  extraPriceMax?: number | null;
  marketplaceServiceId?: number;
  replacementName?: string;
  replacementProvider?: string;
};

function parseMarketplaceIdFromRowId(id: string): number | null {
  if (!id.startsWith("marketplace:")) return null;
  const n = Number(id.slice("marketplace:".length));
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseServiceChoices(json: string | null): {
  sourceById: Record<string, ServiceChoiceSource>;
  replacementByOptionId: Record<string, InquiryVenueOptionReplacement>;
  addonFreelancers: InquiryAddonFreelancerPick[];
  selectedExtraOptionIds: string[];
} {
  const sourceById: Record<string, ServiceChoiceSource> = {};
  const replacementByOptionId: Record<string, InquiryVenueOptionReplacement> = {};
  const addonFreelancers: InquiryAddonFreelancerPick[] = [];
  const selectedExtraOptionIds: string[] = [];

  if (!json?.trim()) {
    return { sourceById, replacementByOptionId, addonFreelancers, selectedExtraOptionIds };
  }

  try {
    const arr = JSON.parse(json) as ParsedServiceRow[];
    if (!Array.isArray(arr)) {
      return { sourceById, replacementByOptionId, addonFreelancers, selectedExtraOptionIds };
    }

    for (const row of arr) {
      const id = typeof row.id === "string" ? row.id : "";
      if (!id) continue;

      if (row.priceMode === "extra") {
        selectedExtraOptionIds.push(id);
      }

      const addonId = parseMarketplaceIdFromRowId(id);
      if (addonId) {
        addonFreelancers.push({
          serviceId: addonId,
          name: (row.label || "").trim() || "שירות במאגר",
          providerName: (row.replacementProvider || "").trim() || "ספק",
          category: null,
          minPrice:
            typeof row.extraPrice === "number" && Number.isFinite(row.extraPrice)
              ? Math.trunc(row.extraPrice)
              : null,
          maxPrice:
            typeof row.extraPriceMax === "number" && Number.isFinite(row.extraPriceMax)
              ? Math.trunc(row.extraPriceMax)
              : null,
        });
        continue;
      }

      const serviceId =
        typeof row.marketplaceServiceId === "number" &&
        Number.isInteger(row.marketplaceServiceId) &&
        row.marketplaceServiceId > 0
          ? row.marketplaceServiceId
          : null;
      const replacementName =
        typeof row.replacementName === "string" ? row.replacementName.trim() : "";

      if (row.source === "external" && serviceId && replacementName) {
        replacementByOptionId[id] = {
          serviceId,
          name: replacementName,
          providerName: (row.replacementProvider || "").trim() || "ספק",
          minPrice:
            typeof row.extraPrice === "number" && Number.isFinite(row.extraPrice)
              ? Math.trunc(row.extraPrice)
              : null,
          maxPrice:
            typeof row.extraPriceMax === "number" && Number.isFinite(row.extraPriceMax)
              ? Math.trunc(row.extraPriceMax)
              : null,
        };
        sourceById[id] = "external";
      } else {
        sourceById[id] = row.source === "external" ? "external" : "venue";
      }
    }
  } catch {
    /* ignore malformed JSON */
  }

  return { sourceById, replacementByOptionId, addonFreelancers, selectedExtraOptionIds };
}

export type InquiryRebookMode = "date" | "edit";

/** בונה טיוטת הזמנה מפנייה קיימת — לשליחה מחדש או עריכה */
export function buildInquiryDraftFromSnapshot(
  snapshot: InquiryRebookSnapshot,
  mode: InquiryRebookMode
): Omit<InquiryDraft, "savedAt"> {
  const { sourceById, replacementByOptionId, addonFreelancers, selectedExtraOptionIds } =
    parseServiceChoices(snapshot.serviceChoicesJson);

  const supplierMessagesByServiceId: Record<number, string> = {};
  for (const entry of parseStoredSupplierMessagesJson(snapshot.supplierMessagesJson)) {
    supplierMessagesByServiceId[entry.serviceId] = entry.message;
  }

  const linked = buildInquiryLinkedSuppliers({ addonFreelancers, replacementByOptionId });
  const selectedSupplierServiceIds = linked.map((s) => s.serviceId);

  const stepId =
    mode === "date"
      ? "event"
      : addonFreelancers.length > 0
        ? "freelancers"
        : Object.keys(replacementByOptionId).length > 0
          ? "offers"
          : "offers";

  return {
    preferredDate: mode === "date" ? "" : snapshot.preferredDate?.trim() || "",
    guestCount:
      snapshot.guestCount != null && Number.isFinite(snapshot.guestCount)
        ? String(snapshot.guestCount)
        : "",
    eventType: snapshot.eventType?.trim() || "",
    message: snapshot.message?.trim() || "",
    supplierMessagesByServiceId,
    stepId,
    sourceById: Object.keys(sourceById).length > 0 ? sourceById : undefined,
    replacementByOptionId:
      Object.keys(replacementByOptionId).length > 0 ? replacementByOptionId : undefined,
    selectedExtraOptionIds:
      selectedExtraOptionIds.length > 0 ? selectedExtraOptionIds : undefined,
    addonFreelancers: addonFreelancers.length > 0 ? addonFreelancers : undefined,
    selectedSupplierServiceIds,
  };
}
