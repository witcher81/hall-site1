"use client";

import {
  FOOD_PRICING_MODE_OPTIONS,
  foodPricingModeForChooser,
  type FoodPricingMode,
  type FoodPricingModeChoice,
} from "@/lib/foodPricingMode";

type Props = {
  value: FoodPricingMode | null;
  /** null = ביטול בחירה */
  onChange: (mode: FoodPricingModeChoice | null) => void;
  /** כשיש כמה תת־קטגוריות — כותרת ספציפית לכל אחת */
  secondaryLabel?: string | null;
};

export default function FoodPricingModeChooser({
  value,
  onChange,
  secondaryLabel,
}: Props) {
  const selected = foodPricingModeForChooser(value);
  const title = secondaryLabel?.trim()
    ? `איך מוכרים את «${secondaryLabel.trim()}»?`
    : "איך אתם מוכרים את האוכל?";

  return (
    <div className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-4 text-right">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-amber-950">{title}</h3>
        {selected ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full border border-amber-300/80 bg-white px-2.5 py-1 text-[11px] font-medium text-amber-950 hover:bg-amber-100/70"
          >
            בטל בחירה
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-amber-900/85">
        {secondaryLabel?.trim()
          ? "בחירה רק לתת־הקטגוריה הזו — לא חובה לבחור גם באחרות. לחיצה חוזרת על אותה אפשרות מבטלת."
          : "בחרו מחיר קבוע או פירמידה יורדת. אפשר לבטל את הבחירה בכל רגע."}
      </p>
      {value === "general" ? (
        <p className="mt-2 rounded-lg border border-amber-300/80 bg-amber-100/60 px-2.5 py-2 text-[11px] leading-relaxed text-amber-950">
          נשמר אצלכם מודל ישן של «הצעה כללית». בחרו מחיר קבוע לראש או פירמידה
          יורדת — או בטלו ובחרו מחדש.
        </p>
      ) : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {FOOD_PRICING_MODE_OPTIONS.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : opt.value)}
              className={`rounded-xl border px-3 py-3 text-right transition ${
                active
                  ? "border-emerald-800 bg-emerald-950 text-white shadow-sm"
                  : "border-neutral-200 bg-white text-neutral-900 hover:border-amber-400/60 hover:bg-[#FFFCF6]"
              }`}
            >
              <span className="block text-sm font-semibold">{opt.title}</span>
              <span
                className={`mt-1 block text-[11px] leading-relaxed ${
                  active ? "text-emerald-100/90" : "text-neutral-600"
                }`}
              >
                {opt.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
