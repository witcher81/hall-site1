"use client";

import type { VenueOfferProductsSlice } from "@/lib/eventTypeSearchFilters";
import {
  offerProductLabelForEvent,
  type OfferProductKey,
  type SoftAttrFilterOption,
} from "@/lib/eventTypeSearchFilters";

/** כותרת ותוויות תואמות לחיפוש אולמות — מאפיינים שנשמרים ב-Venue לסינון */
export const VENUE_OFFER_PRODUCTS_HEADING = "מוצרים שהאולם מציעה";

const offerCheckboxClass =
  "flex cursor-pointer items-center gap-2.5 rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5 text-sm font-medium text-neutral-900 transition hover:border-amber-400/50";
const offerInputClass =
  "h-4 w-4 shrink-0 rounded border-[#C9A227] text-amber-600 focus:ring-amber-400";

export type { VenueOfferProductsSlice };

type Props = {
  values: VenueOfferProductsSlice;
  onChange: <K extends keyof VenueOfferProductsSlice>(
    key: K,
    checked: boolean
  ) => void;
  /** רק מפתחות רלוונטיים לסוג האירוע — null = הסתר (לא נבחר סוג) */
  visibleKeys?: OfferProductKey[] | null;
  /** כותרת משנה לפי סוג אירוע */
  eventTypeLabel?: string;
  /** סוג אירוע — לתוויות מותאמות (למשל «חדר פרטי» בברית) */
  eventType?: string;
  /** מאפיינים רכים מהפרופיל — מוצגים באותו בלוק */
  softAttr?: string;
  softAttrOptions?: SoftAttrFilterOption[];
  onSoftAttrChange?: (value: string) => void;
};

export default function VenueOfferProductsSection({
  values,
  onChange,
  visibleKeys = null,
  eventTypeLabel,
  eventType = "",
  softAttr = "",
  softAttrOptions = [],
  onSoftAttrChange,
}: Props) {
  if (visibleKeys === null) {
    return (
      <div>
        <div className="mb-1">
          <p className="text-xs font-medium text-neutral-600">
            <span className="font-semibold text-emerald-950">
              {VENUE_OFFER_PRODUCTS_HEADING}
            </span>
          </p>
        </div>
        <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-[11px] leading-relaxed text-neutral-600">
          בחרו <strong className="font-semibold text-emerald-950">סוג אירוע</strong>{" "}
          למעלה — יוצגו כאן מסננים מותאמים (חופה לחתונה, גילאים ליום הולדת, בופה, רחבת
          ריקודים ועוד).
        </p>
      </div>
    );
  }

  if (visibleKeys.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-1">
        <p className="text-xs font-medium text-neutral-600">
          <span className="font-semibold text-emerald-950">
            {VENUE_OFFER_PRODUCTS_HEADING}
          </span>
          {eventTypeLabel ? (
            <span className="mr-1 text-neutral-500"> — {eventTypeLabel}</span>
          ) : null}
        </p>
        <p className="text-[11px] leading-relaxed text-neutral-600">
          * אופציונלי — הסימון מסנן אולמות שמציעים את השירות. אוכל וכשרות נבחרים בסקשן האוכל למעלה; חניה בפילטרים נוספים.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visibleKeys.map((key) => (
          <label key={key} className={offerCheckboxClass}>
            <input
              type="checkbox"
              checked={values[key]}
              onChange={(e) => onChange(key, e.target.checked)}
              className={offerInputClass}
            />
            {offerProductLabelForEvent(key, eventType)}
          </label>
        ))}
        {softAttrOptions.map((opt) => (
          <label key={opt.value} className={offerCheckboxClass}>
            <input
              type="checkbox"
              checked={softAttr === opt.value}
              onChange={() =>
                onSoftAttrChange?.(softAttr === opt.value ? "" : opt.value)
              }
              className={offerInputClass}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
