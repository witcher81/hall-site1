"use client";

import { VENUE_KASHRUT_OPTIONS, isKnownVenueKashrut } from "@/lib/venueKashrutOptions";

type Props = {
  value: string;
  onChange: (value: string) => void;
  mode: "form" | "search";
  className?: string;
};

export default function VenueKashrutSelect({ value, onChange, mode, className }: Props) {
  const showLegacy =
    value.trim() !== "" && !isKnownVenueKashrut(value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      {mode === "form" ? (
        <option value="">לא נבחר</option>
      ) : (
        <option value="">כל סוגי הכשרות</option>
      )}
      {VENUE_KASHRUT_OPTIONS.map(({ value: v, label }) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
      {showLegacy ? (
        <option value={value}>{value} (ערך קיים)</option>
      ) : null}
    </select>
  );
}
