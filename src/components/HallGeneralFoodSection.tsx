"use client";

import { useCallback, useState } from "react";
import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
import SeekerExternalSourceToggle from "@/components/SeekerExternalSourceToggle";
import type { HallGeneralPriceMode } from "@/lib/venueBuiltinAmenities";
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
  priceMode: HallGeneralPriceMode;
  onPriceModeChange: (mode: "included" | "extra") => void;
  extraMin: string;
  extraMax: string;
  onExtraPriceChange: (min: string, max: string) => void;
  allowsSeekerExternal: boolean;
  onAllowsSeekerExternalChange: (next: boolean) => void;
  hasEventTypeSection: boolean;
};

export default function HallGeneralFoodSection({
  enabled,
  onEnabledChange,
  mealMinPrice,
  mealMaxPrice,
  onMealPriceChange,
  priceMode,
  onPriceModeChange,
  extraMin,
  extraMax,
  onExtraPriceChange,
  allowsSeekerExternal,
  onAllowsSeekerExternalChange,
  hasEventTypeSection,
}: Props) {
  const [mealRangeKeys, setMealRangeKeys] = useState<Set<string>>(() => new Set());
  const [extraRangeKeys, setExtraRangeKeys] = useState<Set<string>>(() => new Set());

  const mealRangeKey = "food-meal";
  const extraRangeKey = "food-extra";

  const isMealRange = useCallback(
    (min: string, max: string) =>
      mealRangeKeys.has(mealRangeKey) || storedMinMaxIsPriceRange(min, max),
    [mealRangeKeys]
  );

  const isExtraRange = useCallback(
    (min: string, max: string) =>
      extraRangeKeys.has(extraRangeKey) || storedMinMaxIsPriceRange(min, max),
    [extraRangeKeys]
  );

  const modeBtnClass = (active: boolean) =>
    `rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
      active
        ? "border-emerald-950 bg-emerald-950 text-white"
        : "border-[#D4C9BC] bg-white text-neutral-800 hover:bg-neutral-50"
    }`;

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

          <div>
            <p className="mb-2 text-[11px] font-medium text-neutral-700">
              האם האוכל כלול במחיר האולם או בתוספת תשלום?
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={modeBtnClass(priceMode === "included")}
                onClick={() => onPriceModeChange("included")}
              >
                כלול במחיר
              </button>
              <button
                type="button"
                className={modeBtnClass(priceMode === "extra")}
                onClick={() => onPriceModeChange("extra")}
              >
                בתוספת תשלום
              </button>
            </div>
          </div>

          {priceMode === "extra" ? (
            <OptionalPriceRangeFields
              minPrice={extraMin}
              maxPrice={extraMax}
              onChange={onExtraPriceChange}
              useRange={isExtraRange(extraMin, extraMax)}
              onUseRangeChange={(next) => {
                setExtraRangeKeys((prev) => {
                  const copy = new Set(prev);
                  if (next) copy.add(extraRangeKey);
                  else copy.delete(extraRangeKey);
                  return copy;
                });
                if (!next) {
                  const ep =
                    extraMin.trim() && extraMin.trim() === extraMax.trim()
                      ? extraMin.trim()
                      : extraMin.trim() || extraMax.trim();
                  onExtraPriceChange(ep, ep);
                }
              }}
              grouped
              expandAsButton
              singleLabel="תוספת תשלום לאוכל (₪)"
              singlePlaceholder="למשל 500"
              minLabel="מינימום (₪)"
              maxLabel="מקסימום (₪)"
              expandRangeLabel={EXPAND_EXTRA_PRICE_RANGE_LABEL}
              collapseRangeLabel="מחיר קבוע"
              inputClassName={compactPriceInputClass}
              className="!p-2"
            />
          ) : null}

          <div className="border-t border-amber-200/60 pt-2">
            <SeekerExternalSourceToggle
              compact
              checked={allowsSeekerExternal}
              onChange={onAllowsSeekerExternalChange}
            />
          </div>

          {hasEventTypeSection ? (
            <p className="text-[10px] leading-relaxed text-neutral-500">
              מחיר שונה לסוג אירוע מסוים? עדכנו ב«טווחים לפי סוג אירוע» למטה — שדה ריק ישתמש במחיר
              הכללי שצוין כאן.
            </p>
          ) : null}
        </div>
      ) : hasEventTypeSection ? (
        <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
          ללא סימון — הגדרת אוכל נעשית לכל סוג אירוע בנפרד למטה (בחתונה תמיד מניחים שיש אוכל).
        </p>
      ) : null}
    </div>
  );
}
