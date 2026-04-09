"use client";

import { useMemo, useState } from "react";
import { UNIQUE_ISRAEL_CITIES } from "@/components/CityDatalist";

type Props = {
  value: string;
  onChange: (city: string) => void;
  /** After blur (delayed) and when choosing a suggestion — e.g. map geocode sync */
  onCommit?: () => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  /** Merged into suggestions (e.g. cities from search results or a venue’s saved city). */
  extraCities?: readonly string[];
  className: string;
  id?: string;
  name?: string;
  "aria-invalid"?: boolean;
};

export default function CityAutocompleteInput({
  value,
  onChange,
  onCommit,
  disabled = false,
  required = false,
  placeholder = "הקלד עיר או בחר מהרשימה",
  extraCities = [],
  className,
  id,
  name,
  "aria-invalid": ariaInvalid,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const city of UNIQUE_ISRAEL_CITIES) {
      set.add(city);
    }
    for (const c of extraCities) {
      const t = String(c ?? "").trim();
      if (t) set.add(t);
    }
    const sorted = [...set].sort((a, b) => a.localeCompare(b, "he"));
    const v = value.trim();
    if (v && !set.has(v)) {
      return [v, ...sorted];
    }
    return sorted;
  }, [extraCities, value]);

  const filteredCityOptions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return cityOptions;
    return cityOptions.filter((city) => city.toLowerCase().startsWith(q));
  }, [cityOptions, value]);

  function handleBlur() {
    window.setTimeout(() => {
      setMenuOpen(false);
      onCommit?.();
    }, 120);
  }

  function pickCity(city: string) {
    onChange(city);
    setMenuOpen(false);
    onCommit?.();
  }

  return (
    <>
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        required={required}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (!disabled) setMenuOpen(true);
        }}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        aria-invalid={ariaInvalid}
      />
      {!disabled && menuOpen && (
        <div className="mt-2 max-h-52 overflow-auto rounded-xl border border-[#E7E0CF] bg-white shadow-[0_10px_24px_rgba(15,59,46,0.12)]">
          {filteredCityOptions.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[#8A837A]">
              לא נמצאו ערים תואמות.
            </p>
          ) : (
            filteredCityOptions.map((city) => (
              <button
                key={city}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickCity(city)}
                className="block w-full border-b border-[#F0E9DB] px-3 py-2 text-right text-sm text-[#1A1A1A] hover:bg-[#FAF8F4] last:border-b-0"
              >
                {city}
              </button>
            ))
          )}
        </div>
      )}
    </>
  );
}
