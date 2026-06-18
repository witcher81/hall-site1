import { hasFunctionalConsent } from "@/lib/cookieConsent";
import type { InquiryAddonFreelancerPick } from "@/lib/inquiryAddonFreelancers";
import type { ServiceChoiceSource } from "@/lib/venueInquiryAmenities";
import type { SeekerBundleItem } from "@/lib/seekerEventBundleTypes";

const keyForVenue = (venueId: number) => `hh-inquiry-prefill-${venueId}`;

export type InquiryPrefillPayload = {
  sourceById?: Record<string, ServiceChoiceSource>;
  message?: string;
  eventType?: string;
  guestCount?: string;
  selectedExtraOptionIds?: string[];
  addonFreelancers?: InquiryAddonFreelancerPick[];
  eventPackageId?: number;
  seekerBundleId?: number;
  priceEstimateMin?: number;
  priceEstimateMax?: number;
};

export function buildInquiryPrefillFromBundleItems(
  items: SeekerBundleItem[]
): InquiryPrefillPayload {
  const sourceById: Record<string, ServiceChoiceSource> = {};
  const marketplaceNotes: string[] = [];

  for (const it of items) {
    if (it.venueOptionId) {
      sourceById[it.venueOptionId] = it.source;
    }
    if (it.kind === "marketplace") {
      const note = it.serviceName?.trim() || it.label.trim();
      if (note) marketplaceNotes.push(note);
    }
  }

  const message =
    marketplaceNotes.length > 0
      ? `מעוניין/ת גם בשירותים מהמאגר: ${marketplaceNotes.join(", ")}.`
      : undefined;

  return {
    sourceById: Object.keys(sourceById).length > 0 ? sourceById : undefined,
    message,
  };
}

export function saveInquiryPrefill(venueId: number, data: InquiryPrefillPayload): void {
  if (typeof window === "undefined" || !hasFunctionalConsent()) return;
  try {
    window.sessionStorage.setItem(keyForVenue(venueId), JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadInquiryPrefill(venueId: number): InquiryPrefillPayload | null {
  if (typeof window === "undefined" || !hasFunctionalConsent()) return null;
  try {
    const raw = window.sessionStorage.getItem(keyForVenue(venueId));
    if (!raw) return null;
    const data = JSON.parse(raw) as InquiryPrefillPayload;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

export function clearInquiryPrefill(venueId: number): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(keyForVenue(venueId));
  } catch {
    /* ignore */
  }
}
