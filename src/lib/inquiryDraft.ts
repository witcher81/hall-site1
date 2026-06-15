import { hasFunctionalConsent } from "@/lib/cookieConsent";
import type { InquiryAddonFreelancerPick } from "@/lib/inquiryAddonFreelancers";

const keyForVenue = (venueId: number) => `hh-inquiry-draft-${venueId}`;

export type InquiryDraft = {
  preferredDate: string;
  guestCount: string;
  eventType: string;
  message: string;
  stepId: string;
  sourceById?: Record<string, "venue" | "external">;
  addonFreelancers?: InquiryAddonFreelancerPick[];
  savedAt: number;
};

export function loadInquiryDraft(venueId: number): InquiryDraft | null {
  if (typeof window === "undefined" || !hasFunctionalConsent()) return null;
  try {
    const raw = window.localStorage.getItem(keyForVenue(venueId));
    if (!raw) return null;
    const data = JSON.parse(raw) as InquiryDraft;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

export function saveInquiryDraft(venueId: number, draft: Omit<InquiryDraft, "savedAt">): void {
  if (typeof window === "undefined" || !hasFunctionalConsent()) return;
  try {
    window.localStorage.setItem(
      keyForVenue(venueId),
      JSON.stringify({ ...draft, savedAt: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

export function clearInquiryDraft(venueId: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyForVenue(venueId));
  } catch {
    /* ignore */
  }
}
