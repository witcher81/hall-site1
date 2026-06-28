import { formatNisRange } from "./inquiryCostEstimate";

export type CheckoutLineItem = {
  id: string;
  label: string;
  amountMin: number | null;
  amountMax: number | null;
  note?: string;
};

export type CheckoutOrderSummary = {
  kind: "venue-inquiry" | "demo";
  title: string;
  subtitle?: string;
  meta: Array<{ label: string; value: string }>;
  lineItems: CheckoutLineItem[];
  totalMin: number | null;
  totalMax: number | null;
  depositPercent: number;
  inquiryId?: number;
  venueId?: number;
};

export function formatCheckoutAmount(
  min: number | null,
  max: number | null
): string {
  return formatNisRange(min, max);
}

export function depositAmounts(
  totalMin: number | null,
  totalMax: number | null,
  percent: number
): { min: number | null; max: number | null } {
  if (totalMin == null) return { min: null, max: null };
  const min = Math.round((totalMin * percent) / 100);
  const max =
    totalMax != null && totalMax !== totalMin
      ? Math.round((totalMax * percent) / 100)
      : min;
  return { min, max };
}

export function demoCheckoutSummary(): CheckoutOrderSummary {
  return {
    kind: "demo",
    title: "אולם גן העיר — תצוגה מקדימה",
    subtitle: "דף סליקה לדוגמה (ללא חיוב אמיתי)",
    meta: [
      { label: "תאריך אירוע", value: "15.08.2026" },
      { label: "סוג אירוע", value: "חתונה" },
      { label: "מספר אורחים", value: "180" },
    ],
    lineItems: [
      {
        id: "venue",
        label: "אולם + כלול במחיר",
        amountMin: 45_000,
        amountMax: 52_000,
      },
      {
        id: "extra-bar",
        label: "בר נוסף",
        amountMin: 3_500,
        amountMax: 3_500,
        note: "תוספת בתשלום",
      },
      {
        id: "extra-dj",
        label: "DJ (ספק חיצוני)",
        amountMin: 4_000,
        amountMax: 5_500,
        note: "תוספת בתשלום",
      },
    ],
    totalMin: 52_500,
    totalMax: 61_000,
    depositPercent: 20,
  };
}

type InquiryCheckoutInput = {
  id: number;
  venueId: number;
  eventType: string | null;
  preferredDate: string | null;
  guestCount: number | null;
  venue: {
    name: string;
    city: string | null;
    minPrice: number | null;
    maxPrice: number | null;
  };
};

export function inquiryToCheckoutSummary(
  inquiry: InquiryCheckoutInput
): CheckoutOrderSummary {
  const meta: CheckoutOrderSummary["meta"] = [];
  if (inquiry.preferredDate) {
    meta.push({ label: "תאריך אירוע", value: inquiry.preferredDate });
  }
  if (inquiry.eventType) {
    meta.push({ label: "סוג אירוע", value: inquiry.eventType });
  }
  if (inquiry.guestCount != null) {
    meta.push({
      label: "מספר אורחים",
      value: inquiry.guestCount.toLocaleString("he-IL"),
    });
  }
  if (inquiry.venue.city) {
    meta.push({ label: "עיר", value: inquiry.venue.city });
  }

  const lineItems: CheckoutLineItem[] = [
    {
      id: "venue-base",
      label: "אולם — הערכת מחיר",
      amountMin: inquiry.venue.minPrice,
      amountMax: inquiry.venue.maxPrice,
      note: "המחיר הסופי ייקבע לאחר אישור בעל האולם",
    },
  ];

  const totalMin = inquiry.venue.minPrice;
  const totalMax =
    inquiry.venue.maxPrice != null &&
    inquiry.venue.minPrice != null &&
    inquiry.venue.maxPrice !== inquiry.venue.minPrice
      ? inquiry.venue.maxPrice
      : inquiry.venue.minPrice;

  return {
    kind: "venue-inquiry",
    inquiryId: inquiry.id,
    venueId: inquiry.venueId,
    title: inquiry.venue.name,
    subtitle: `הזמנה #${inquiry.id}`,
    meta,
    lineItems,
    totalMin,
    totalMax,
    depositPercent: 20,
  };
}
