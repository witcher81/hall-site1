"use client";

import { useCallback, useState } from "react";
import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
import SeekerExternalWithEventTypes from "@/components/SeekerExternalWithEventTypes";
import { storedMinMaxIsPriceRange } from "@/lib/freelancerServicePriceForm";

const compactPriceInputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-amber-400";

const EXPAND_EXTRA_PRICE_RANGE_LABEL = "אין לך מחיר מדויק? הכנס טווח מחירים";

type Props = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  mealMinPrice: string;
  mealMaxPrice: string;
  onMealPriceChange: (min: string, max: string) => void;
  allowsSeekerExternal: boolean;
  onAllowsSeekerExternalChange: (next: boolean) => void;
  seekerExternalEventTypes: string[];
  onSeekerExternalEventTypesChange: (next: string[]) => void;
  eventTypes: string[];
  hasEventTypeSection: boolean;
};

export default function HallGeneralFoodSection({
  enabled,
  onEnabledChange,
  mealMinPrice,
  mealMaxPrice,
  onMealPriceChange,
  allowsSeekerExternal,
  onAllowsSeekerExternalChange,
  seekerExternalEventTypes,
  onSeekerExternalEventTypesChange,
  eventTypes,
  hasEventTypeSection,
}: Props) {
  const [mealRangeKeys, setMealRangeKeys] = useState<Set<string>>(() => new Set());

  const mealRangeKey = "food-meal";

  const isMealRange = useCallback(
    (min: string, max: string) =>
      mealRangeKeys.has(mealRangeKey) || storedMinMaxIsPriceRange(min, max),
    [mealRangeKeys]
  );

  return (
    <div className="mb-4 rounded-xl border border-amber-200/70 bg-amber-50/40 p-3">
      <p className="text-xs font-semibold text-emerald-950">אוכל</p>
      <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
        סמנו אם האולם מציע אוכל לכל סוגי האירועים. מחיר למנה כללי יוצג למחפשים; אפשר לעדכן מחיר
        נפרד לסוג אירוע ספציפי למטה.
      </p>

      <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-neutral-800">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="checkbox-hall shrink-0"
        />
        <span className="font-medium">יש אוכל בכל סוגי האירועים</span>
      </label>

      {enabled ? (
        <div className="mt-3 space-y-3 border-t border-amber-200/60 pt-3">
          <OptionalPriceRangeFields
            minPrice={mealMinPrice}
            maxPrice={mealMaxPrice}
            onChange={onMealPriceChange}
            useRange={isMealRange(mealMinPrice, mealMaxPrice)}
            onUseRangeChange={(next) => {
              setMealRangeKeys((prev) => {
                const copy = new Set(prev);
                if (next) copy.add(mealRangeKey);
                else copy.delete(mealRangeKey);
                return copy;
              });
              if (!next) {
                const ep =
                  mealMinPrice.trim() && mealMinPrice.trim() === mealMaxPrice.trim()
                    ? mealMinPrice.trim()
                    : mealMinPrice.trim() || mealMaxPrice.trim();
                onMealPriceChange(ep, ep);
              }
            }}
            grouped
            expandAsButton
            singleLabel="מחיר למנה כללי (₪)"
            singlePlaceholder="למשל 250"
            minLabel="מינימום למנה (₪)"
            maxLabel="מקסימום למנה (₪)"
            expandRangeLabel={EXPAND_EXTRA_PRICE_RANGE_LABEL}
            collapseRangeLabel="מחיר קבוע למנה"
            inputClassName={compactPriceInputClass}
            className="!p-2"
          />

          <div className="border-t border-amber-200/60 pt-2">
            <SeekerExternalWithEventTypes
              compact
              checked={allowsSeekerExternal}
              onCheckedChange={onAllowsSeekerExternalChange}
              eventTypes={eventTypes}
              selectedEventTypes={seekerExternalEventTypes}
              onSelectedEventTypesChange={onSeekerExternalEventTypesChange}
            />
          </div>
        </div>
      ) : hasEventTypeSection ? (
        <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
          ללא סימון — הגדרת אוכל נעשית לכל סוג אירוע בנפרד למטה (בחתונה תמיד מניחים שיש אוכל).
        </p>
      ) : null}
    </div>
  );
}
