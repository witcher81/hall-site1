"use client";

import { useEffect, useState } from "react";
import {
  parseMinMaxToFreelancerPriceForm,
  storedMinMaxIsPriceRange,
} from "@/lib/freelancerServicePriceForm";

const defaultInputClass =
  "w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs outline-none focus:border-[#C9A227]";

export type OptionalPriceRangeFieldsProps = {
  minPrice: string;
  maxPrice: string;
  onChange: (min: string, max: string) => void;
  /** מצב טווח — כשמועבר, הרכיב בשליטה מלאה של ההורה */
  useRange?: boolean;
  onUseRangeChange?: (useRange: boolean) => void;
  /** שינוי מפתח מאפס מצב פנימי (למשל סוג אירוע אחר) */
  resetKey?: string;
  singleLabel?: string;
  singlePlaceholder?: string;
  minLabel?: string;
  maxLabel?: string;
  expandRangeLabel?: string;
  collapseRangeLabel?: string;
  className?: string;
  inputClassName?: string;
};

export default function OptionalPriceRangeFields({
  minPrice,
  maxPrice,
  onChange,
  useRange: controlledUseRange,
  onUseRangeChange,
  resetKey,
  singleLabel = "מחיר (₪)",
  singlePlaceholder = "למשל 250",
  minLabel = "מחיר מינימלי (₪)",
  maxLabel = "מחיר מקסימלי (₪)",
  expandRangeLabel = "אין לך מחיר קבוע? הכנס טווח מחירים",
  collapseRangeLabel = "יש לי מחיר קבוע",
  className = "",
  inputClassName = defaultInputClass,
}: OptionalPriceRangeFieldsProps) {
  const storedIsRange = storedMinMaxIsPriceRange(minPrice, maxPrice);
  const [internalUseRange, setInternalUseRange] = useState(storedIsRange);

  useEffect(() => {
    if (resetKey === undefined) return;
    setInternalUseRange(storedMinMaxIsPriceRange(minPrice, maxPrice));
  }, [resetKey, minPrice, maxPrice]);

  const useRange = controlledUseRange ?? internalUseRange;

  const setUseRange = (next: boolean) => {
    if (controlledUseRange === undefined) {
      setInternalUseRange(next);
    }
    onUseRangeChange?.(next);
  };

  const derived = parseMinMaxToFreelancerPriceForm(minPrice, maxPrice);
  const singleValue = useRange
    ? ""
    : derived.exactPrice || (minPrice === maxPrice ? minPrice : minPrice || maxPrice);

  const enableRange = () => {
    const v = singleValue.trim();
    setUseRange(true);
    onChange(v, v || maxPrice.trim());
  };

  const disableRange = () => {
    const ep =
      minPrice.trim() && minPrice.trim() === maxPrice.trim()
        ? minPrice.trim()
        : minPrice.trim() || maxPrice.trim();
    setUseRange(false);
    onChange(ep, ep);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {!useRange ? (
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#5F5F5F]">
            {singleLabel}
          </label>
          <input
            type="number"
            min={0}
            value={singleValue}
            onChange={(e) => {
              const v = e.target.value;
              onChange(v, v);
            }}
            className={inputClassName}
            placeholder={singlePlaceholder}
          />
          <button
            type="button"
            onClick={enableRange}
            className="mt-2 text-[11px] font-medium text-[#0F3B2E] underline decoration-[#C9A227]/60 underline-offset-2 hover:text-[#174D3B]"
          >
            {expandRangeLabel}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#5F5F5F]">
                {minLabel}
              </label>
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => onChange(e.target.value, maxPrice)}
                className={inputClassName}
                placeholder="150"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#5F5F5F]">
                {maxLabel}
              </label>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => onChange(minPrice, e.target.value)}
                className={inputClassName}
                placeholder="350"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={disableRange}
            className="text-[11px] font-medium text-[#5F5F5F] underline decoration-[#E0D4C3] underline-offset-2 hover:text-[#2A261F]"
          >
            {collapseRangeLabel}
          </button>
        </div>
      )}
    </div>
  );
}
