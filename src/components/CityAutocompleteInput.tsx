"use client";

import { useMemo, useState } from "react";
import { UNIQUE_ISRAEL_CITIES } from "@/components/CityDatalist";
import { isCityAvailable } from "@/lib/searchAvailabilityPure";

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
  /**
   * ערים עם אולמות מאושרים. אם מועבר — ערים אחרות מוצגות כחסומות.
   * לא מועבר (למשל טופס בעל אולם) — כל הערים ניתנות לבחירה.
   */
  availableCities?: readonly string[];
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
  availableCities,
  className,
  id,
  name,
  "aria-invalid": ariaInvalid,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockedHint, setBlockedHint] = useState<string | null>(null);
  const safeValue = typeof value === "string" ? value : String(value ?? "");
  const enforceAvailability = availableCities != null;

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
    const v = safeValue.trim();
    if (v && !set.has(v)) {
      return [v, ...sorted];
    }
    return sorted;
  }, [extraCities, safeValue]);

  const filteredCityOptions = useMemo(() => {
    const q = safeValue.trim().toLowerCase();
    if (!q) return cityOptions;
    return cityOptions.filter((city) => city.toLowerCase().startsWith(q));
  }, [cityOptions, safeValue]);

  function cityHasListings(city: string): boolean {
    if (!enforceAvailability) return true;
    return isCityAvailable(availableCities!, city);
  }

  function handleBlur() {
    window.setTimeout(() => {
      setMenuOpen(false);
      if (enforceAvailability) {
        const t = safeValue.trim();
        if (t && !cityHasListings(t)) {
          setBlockedHint(`אין עדיין אולמות ב${t}`);
          onChange("");
          onCommit?.();
          return;
        }
      }
      setBlockedHint(null);
      onCommit?.();
    }, 120);
  }

  function pickCity(city: string) {
    if (!cityHasListings(city)) {
      setBlockedHint(`אין עדיין אולמות ב${city}`);
      return;
    }
    setBlockedHint(null);
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
        value={safeValue}
        required={required}
        autoComplete="off"
        onChange={(e) => {
          setBlockedHint(null);
          onChange(e.target.value);
        }}
        onFocus={() => {
          if (!disabled) setMenuOpen(true);
        }}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        aria-invalid={ariaInvalid || Boolean(blockedHint) || undefined}
      />
      {blockedHint ? (
        <p className="mt-1.5 text-xs font-medium text-amber-900" role="status">
          {blockedHint}
        </p>
      ) : null}
      {!disabled && menuOpen && (
        <div className="mt-2 max-h-52 overflow-auto rounded-xl border border-neutral-200 bg-white shadow-[0_10px_24px_rgba(15,59,46,0.12)]">
          {filteredCityOptions.length === 0 ? (
            <p className="px-3 py-2 text-xs text-neutral-500">
              לא נמצאו ערים תואמות.
            </p>
          ) : (
            filteredCityOptions.map((city) => {
              const available = cityHasListings(city);
              return (
                <button
                  key={city}
                  type="button"
                  disabled={!available}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickCity(city)}
                  title={available ? undefined : "אין עדיין אולמות בעיר זו"}
                  className={`flex w-full items-center justify-between gap-2 border-b border-[#F0E9DB] px-3 py-2 text-right text-sm last:border-b-0 ${
                    available
                      ? "text-neutral-900 hover:bg-neutral-50"
                      : "cursor-not-allowed bg-neutral-50/80 text-neutral-400"
                  }`}
                >
                  <span>{city}</span>
                  {!available ? (
                    <span className="shrink-0 text-[10px] font-medium text-amber-800/90">
                      אין עדיין אולמות
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      )}
    </>
  );
}
