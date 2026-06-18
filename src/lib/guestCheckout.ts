/** שמירת הזמנה ממתינה לאורח — מושלמת אחרי התחברות/הרשמה */

export type PendingVenueInquiryPayload = {
  venueId: number;
  message: string;
  supplierMessages: Array<{ serviceId: number; message: string }>;
  supplierServiceIds: number[];
  preferredDate: string;
  guestCount: number;
  eventType: string | null;
  serviceChoices: unknown[];
  addonServiceIds: number[];
  addonFreelancers: unknown[];
  eventPackageId?: number | null;
  seekerBundleId?: number | null;
  priceEstimateMin?: number | null;
  priceEstimateMax?: number | null;
};

export type PendingServiceRequestPayload = {
  serviceId: number;
  preferredDate: string;
  eventType?: string;
  message: string;
};

export type PendingCheckout =
  | { kind: "venue-inquiry"; venueId: number; payload: PendingVenueInquiryPayload }
  | { kind: "service-request"; serviceId: number; payload: PendingServiceRequestPayload };

const STORAGE_KEY = "hh-pending-checkout";

export function savePendingCheckout(data: PendingCheckout): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function loadPendingCheckout(): PendingCheckout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PendingCheckout & { savedAt?: number };
    if (!data?.kind) return null;
    if (data.kind === "venue-inquiry" && typeof data.venueId === "number") {
      return { kind: "venue-inquiry", venueId: data.venueId, payload: data.payload };
    }
    if (data.kind === "service-request" && typeof data.serviceId === "number") {
      return { kind: "service-request", serviceId: data.serviceId, payload: data.payload };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPendingCheckout(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

/** קישור להרשמה/התחברות להשלמת הזמנה */
export function checkoutAuthHref(
  returnPath: string,
  mode: "register" | "login" = "register"
): string {
  const base = mode === "register" ? "/auth/register" : "/auth/login";
  const params = new URLSearchParams();
  params.set("redirect", returnPath);
  params.set("checkout", "1");
  return `${base}?${params.toString()}`;
}
