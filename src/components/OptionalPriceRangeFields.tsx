"use client";

import { useEffect, useState } from "react";
import { parseMinMaxToFreelancerPriceForm } from "@/lib/freelancerServicePriceForm";

const inputClass =
  "w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs outline-none focus:border-[#C9A227]";

type OptionalPriceRangeFieldsProps = {
  minPrice: string;
  maxPrice: string;
  onChange: (min: string, max: string) => void;
  singleLabel?: string;
  singlePlaceholder?: string;
  className?: string;
};

export default function OptionalPriceRangeFields({
  minPrice,
  maxPrice,
  onChange,
  singleLabel = "מחיר למנה (₪)",
  singlePlaceholder = "למשל 250",
  className = "",
}: OptionalPriceRangeFieldsProps) {
  const derived = parseMinMaxToFreelancerPriceForm(minPrice, maxPrice);
  const [useRange, setUseRange] = useState(derived.priceUseRange);

  useEffect(() => {
    setUseRange(derived.priceUseRange);
  }, [minPrice, maxPrice, derived.priceUseRange]);

  const singleValue = useRange
    ? ""
    : derived.exactPrice || (minPrice === maxPrice ? minPrice : minPrice || maxPrice);

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
            className={inputClass}
            placeholder={singlePlaceholder}
          />
          <button
            type="button"
            onClick={() => {
              const v = singleValue.trim();
              setUseRange(true);
              onChange(v, v || maxPrice.trim());
            }}
            className="mt-2 text-[11px] font-medium text-[#0F3B2E] underline decoration-[#C9A227]/60 underline-offset-2 hover:text-[#174D3B]"
          >
            אין לך מחיר קבוע? הכנס טווח מחירים
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#5F5F5F]">
                מחיר מינימלי (₪)
              </label>
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => onChange(e.target.value, maxPrice)}
                className={inputClass}
                placeholder="150"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#5F5F5F]">
                מחיר מקסימלי (₪)
              </label>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => onChange(minPrice, e.target.value)}
                className={inputClass}
                placeholder="350"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const ep =
                minPrice.trim() && minPrice.trim() === maxPrice.trim()
                  ? minPrice.trim()
                  : minPrice.trim() || maxPrice.trim();
              setUseRange(false);
              onChange(ep, ep);
            }}
            className="text-[11px] font-medium text-[#5F5F5F] underline decoration-[#E0D4C3] underline-offset-2 hover:text-[#2A261F]"
          >
            יש לי מחיר קבוע למנה
          </button>
        </div>
      )}
    </div>
  );
}
