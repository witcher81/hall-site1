"use client";

/** כותרת ותוויות תואמות לחיפוש אולמות — מאפיינים שנשמרים ב-Venue לסינון */
export const VENUE_OFFER_PRODUCTS_HEADING = "מוצרים שהאולם מציעה";

const offerCheckboxClass =
  "flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E7E0CF]/80 bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1A] transition hover:border-[#C9A227]/50";
const offerInputClass =
  "h-4 w-4 shrink-0 rounded border-[#C9A227] text-[#C9A227] focus:ring-[#C9A227]";

export type VenueOfferProductsSlice = {
  seaView: boolean;
  boutique: boolean;
  accessible: boolean;
  hasChuppa: boolean;
  hasFood: boolean;
  hasTableSetup: boolean;
  hasDanceFloor: boolean;
  hasSoundSystem: boolean;
};

type Props = {
  values: VenueOfferProductsSlice;
  onChange: <K extends keyof VenueOfferProductsSlice>(
    key: K,
    checked: boolean
  ) => void;
  /** כשיש חתונה — חופה מפורטת למטה (חוץ/מקורה); התיבה משקפת בלבד */
  chuppaDetailLocked?: boolean;
  /** כשהאוכל נגזר מסוגי אירוע — לא לשנות את תיבת האוכל ידנית */
  foodLockedFromEvents?: boolean;
};

export default function VenueOfferProductsSection({
  values,
  onChange,
  chuppaDetailLocked = false,
  foodLockedFromEvents = false,
}: Props) {
  return (
    <div>
      <div className="mb-1">
        <p className="text-xs font-medium text-[#5F5F5F]">
          <span className="font-semibold text-[#0F3B2E]">
            {VENUE_OFFER_PRODUCTS_HEADING}
          </span>
          <span className="mr-0.5 text-[#C9A227]" aria-hidden>
            *
          </span>
        </p>
        <p className="text-[11px] leading-relaxed text-[#6B6560]">
          * אופציונלי — אין חובה לסמן אף מאפיין; הסימון משמש לסינון ולתצוגה בלבד.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <label className={offerCheckboxClass}>
          <input
            type="checkbox"
            checked={values.seaView}
            onChange={(e) => onChange("seaView", e.target.checked)}
            className={offerInputClass}
          />
          נוף לים
        </label>
        <label className={offerCheckboxClass}>
          <input
            type="checkbox"
            checked={values.boutique}
            onChange={(e) => onChange("boutique", e.target.checked)}
            className={offerInputClass}
          />
          אירועי בוטיק
        </label>
        <label className={offerCheckboxClass}>
          <input
            type="checkbox"
            checked={values.accessible}
            onChange={(e) => onChange("accessible", e.target.checked)}
            className={offerInputClass}
          />
          נגישות לנכים
        </label>
        <label
          className={`${offerCheckboxClass}${chuppaDetailLocked ? " opacity-90" : ""}`}
          title={
            chuppaDetailLocked
              ? "לחתונה: סמנו למטה חופה בחוץ או חופה מקורה"
              : undefined
          }
        >
          <input
            type="checkbox"
            checked={values.hasChuppa}
            disabled={chuppaDetailLocked}
            onChange={(e) => onChange("hasChuppa", e.target.checked)}
            className={offerInputClass}
          />
          כולל חופה
        </label>
        <label
          className={`${offerCheckboxClass}${foodLockedFromEvents ? " opacity-90" : ""}`}
          title={
            foodLockedFromEvents
              ? "מסומן לפי סוגי האירוע (אוכל לחתונה או לאירועים עם מחירי מנות)"
              : undefined
          }
        >
          <input
            type="checkbox"
            checked={values.hasFood}
            disabled={foodLockedFromEvents}
            onChange={(e) => onChange("hasFood", e.target.checked)}
            className={offerInputClass}
          />
          כולל אוכל
        </label>
        <label className={offerCheckboxClass}>
          <input
            type="checkbox"
            checked={values.hasTableSetup}
            onChange={(e) => onChange("hasTableSetup", e.target.checked)}
            className={offerInputClass}
          />
          סידור שולחנות
        </label>
        <label className={offerCheckboxClass}>
          <input
            type="checkbox"
            checked={values.hasDanceFloor}
            onChange={(e) => onChange("hasDanceFloor", e.target.checked)}
            className={offerInputClass}
          />
          רחבת ריקודים
        </label>
        <label className={offerCheckboxClass}>
          <input
            type="checkbox"
            checked={values.hasSoundSystem}
            onChange={(e) => onChange("hasSoundSystem", e.target.checked)}
            className={offerInputClass}
          />
          מערכת הגברה
        </label>
      </div>
      {chuppaDetailLocked ? (
        <p className="mt-2 text-[11px] text-[#6B6560]">
          לחתונה: סמנו למטה &quot;חופה בחוץ&quot; ו/או &quot;חופה מקורה&quot;.
        </p>
      ) : null}
    </div>
  );
}
