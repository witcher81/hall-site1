"use client";

import {
  FOOD_PRICING_MODE_OPTIONS,
  foodPricingModeForChooser,
  type FoodPricingMode,
  type FoodPricingModeChoice,
} from "@/lib/foodPricingMode";

type Props = {
  value: FoodPricingMode | null;
  onChange: (mode: FoodPricingModeChoice) => void;
};

export default function FoodPricingModeChooser({ value, onChange }: Props) {
  const selected = foodPricingModeForChooser(value);

  return (
    <div className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-4 text-right">
      <h3 className="text-sm font-semibold text-amber-950">
        איך אתם מוכרים את האוכל?
      </h3>
      <p className="mt-1 text-[11px] leading-relaxed text-amber-900/85">
        תמיד לפי ראש (לאורח). בחרו אם המחיר קבוע, או פירמידה יורדת לפי כמות
        האורחים — ואז ייפתח התפריט למילוי.
      </p>
      {value === "general" ? (
        <p className="mt-2 rounded-lg border border-amber-300/80 bg-amber-100/60 px-2.5 py-2 text-[11px] leading-relaxed text-amber-950">
          נשמר אצלכם מודל ישן של «הצעה כללית». בחרו כאן מחיר קבוע לראש או פירמידה
          יורדת כדי לעדכן.
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
              onClick={() => onChange(opt.value)}
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
