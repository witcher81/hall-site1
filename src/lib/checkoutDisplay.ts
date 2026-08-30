import { formatNisRange } from "./inquiryCostEstimate";
import { getCatalogPricingMode } from "./catalogPricingMode";

export type CheckoutLineItem = {
  id: string;
  label: string;
  amountMin: number | null;
  amountMax: number | null;
  note?: string;
};

export type CheckoutOrderSummary = {
  kind: "venue-inquiry";
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

/** דף סליקה להזמנת אולם לפי מזהה פנייה */
export function inquiryCheckoutHref(inquiryId: number): string {
  return `/checkout?inquiryId=${inquiryId}`;
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
    hallRentalMin?: number | null;
    hallRentalMax?: number | null;
  };
};

export type InquiryCheckoutPricingOverride = {
  /** מחיר מדויק שאושר בשרשור האולם */
  acceptedExactAmount?: number | null;
  /** סכום קטלוג קבוע מחושב (כשאין התמקחות) */
  fixedCatalogAmount?: number | null;
};

export function inquiryToCheckoutSummary(
  inquiry: InquiryCheckoutInput,
  override?: InquiryCheckoutPricingOverride
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

  const hallMin = inquiry.venue.hallRentalMin ?? inquiry.venue.minPrice;
  const hallMax =
    inquiry.venue.hallRentalMax ?? inquiry.venue.maxPrice ?? hallMin;
  const hallMode = getCatalogPricingMode(hallMin, hallMax);

  const exact =
    override?.acceptedExactAmount ??
    override?.fixedCatalogAmount ??
    (hallMode === "fixed" ? hallMin : null);

  const lineItems: CheckoutLineItem[] = [
    {
      id: "venue-base",
      label: exact != null ? "אולם — מחיר סופי" : "אולם — הערכת מחיר",
      amountMin: exact ?? hallMin,
      amountMax: exact ?? hallMax,
      note:
        exact != null
          ? override?.acceptedExactAmount != null
            ? "לפי ציטוט שאושר"
            : "מחיר קבוע מהקטלוג"
          : "המחיר הסופי ייקבע לאחר ציטוט מדויק מבעל האולם",
    },
  ];

  const totalMin = exact ?? hallMin;
  const totalMax =
    exact != null
      ? exact
      : hallMax != null && hallMin != null && hallMax !== hallMin
        ? hallMax
        : hallMin;

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
