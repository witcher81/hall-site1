"use client";

import { useMemo } from "react";
import { UNIQUE_ISRAEL_CITIES } from "@/components/CityDatalist";

const SORTED_ISRAEL_CITIES = [...UNIQUE_ISRAEL_CITIES].sort((a, b) =>
  a.localeCompare(b, "he")
);

type Props = {
  value: string;
  onChange: (city: string) => void;
  onBlur?: () => void;
  required?: boolean;
};

export default function CitySelect({
  value,
  onChange,
  onBlur,
  required = true,
}: Props) {
  const options = useMemo(() => {
    const v = value.trim();
    if (v && !SORTED_ISRAEL_CITIES.includes(v)) {
      return [v, ...SORTED_ISRAEL_CITIES];
    }
    return SORTED_ISRAEL_CITIES;
  }, [value]);

  const trimmed = value.trim();

  return (
    <select
      required={required}
      value={trimmed}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      dir="rtl"
      className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
    >
      <option value="" disabled>
        בחר עיר
      </option>
      {options.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
    </select>
  );
}
