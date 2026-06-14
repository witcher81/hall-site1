"use client";

import {
  VENUE_TYPE_CUSTOM_MAX_LEN,
  VENUE_TYPE_OPTIONS,
  VENUE_TYPE_OTHER_SENTINEL,
  isKnownVenueType,
  venueTypeSelectValue,
} from "@/lib/venueTypeOptions";

type Props = {
  value: string;
  onChange: (value: string) => void;
  mode: "form" | "search";
  className?: string;
  customInputClassName?: string;
  required?: boolean;
};

export default function VenueTypeSelect({
  value,
  onChange,
  mode,
  className,
  customInputClassName,
  required = false,
}: Props) {
  const selectValue = venueTypeSelectValue(value, mode);
  const showCustom = mode === "form" && selectValue === VENUE_TYPE_OTHER_SENTINEL;

  return (
    <div className="space-y-2">
      <select
        required={required && !showCustom}
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === VENUE_TYPE_OTHER_SENTINEL) {
            onChange("");
            return;
          }
          onChange(next);
        }}
        className={className}
      >
        {mode === "search" ? (
          <option value="">כל הסוגים</option>
        ) : null}
        {VENUE_TYPE_OPTIONS.map(({ value: v, label }) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
        {mode === "form" ? (
          <option value={VENUE_TYPE_OTHER_SENTINEL}>אחר</option>
        ) : null}
      </select>

      {showCustom ? (
        <div>
          <label className="block text-[11px] font-medium text-neutral-600">
            איך אתם קוראים לסוג המקום? *
          </label>
          <input
            type="text"
            required
            maxLength={VENUE_TYPE_CUSTOM_MAX_LEN}
            value={isKnownVenueType(value) ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="למשל: מתחם יין, אולם בקיבוץ, חוות דעת…"
            className={
              customInputClassName ??
              "mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
            }
          />
        </div>
      ) : null}
    </div>
  );
}
