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
  useRange?: boolean;
  onUseRangeChange?: (useRange: boolean) => void;
  resetKey?: string;
  singleLabel?: string;
  singlePlaceholder?: string;
  minLabel?: string;
  maxLabel?: string;
  expandRangeLabel?: string;
  collapseRangeLabel?: string;
  /** מסגרת אחת — הכותרת והשדה נראים כיחידה */
  grouped?: boolean;
  expandAsButton?: boolean;
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
  grouped = false,
  expandAsButton = false,
  className = "",
  inputClassName = defaultInputClass,
}: OptionalPriceRangeFieldsProps) {
  const [internalUseRange, setInternalUseRange] = useState(() =>
    storedMinMaxIsPriceRange(minPrice, maxPrice)
  );

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

  const expandBtnClass = expandAsButton
    ? "mt-2 rounded-lg border border-[#D4C9BC] bg-[#FAF7F2] px-2.5 py-1.5 text-[11px] font-medium text-[#0F3B2E] hover:bg-[#EFE6D5]"
    : "mt-2 text-[11px] font-medium text-[#0F3B2E] underline decoration-[#C9A227]/60 underline-offset-2 hover:text-[#174D3B]";

  const collapseBtnClass = expandAsButton
    ? "rounded-lg border border-[#E0D4C3] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#5F5F5F] hover:bg-[#FAF7F2]"
    : "text-[11px] font-medium text-[#5F5F5F] underline decoration-[#E0D4C3] underline-offset-2 hover:text-[#2A261F]";

  const outerClass = grouped
    ? `rounded-xl border border-[#E0D4C3]/90 bg-white/90 p-3 ${className}`
    : className;

  const titleClass = grouped
    ? "mb-2 block text-xs font-semibold text-[#0F3B2E]"
    : "mb-1 block text-[11px] font-medium text-[#5F5F5F]";

  return (
    <div className={`space-y-2 ${outerClass}`}>
      {!useRange ? (
        <div>
          <p className={titleClass}>{singleLabel}</p>
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
          <button type="button" onClick={enableRange} className={expandBtnClass}>
            {expandRangeLabel}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {grouped ? (
            <p className="mb-1 text-xs font-semibold text-[#0F3B2E]">טווח מחירים (₪)</p>
          ) : null}
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
          <button type="button" onClick={disableRange} className={collapseBtnClass}>
            {collapseRangeLabel}
          </button>
        </div>
      )}
    </div>
  );
}
