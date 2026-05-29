"use client";

import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
import SeekerExternalSourceToggle from "@/components/SeekerExternalSourceToggle";
import { defaultSeekerExternalForCustomRow } from "@/lib/venueAmenitySeekerExternal";
import type { VenueEditCustomHallRow } from "@/lib/venueEditFormParse";

const compactPriceInputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-amber-400";

type Props = {
  eventType: string;
  rows: VenueEditCustomHallRow[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onRowsChange: (rows: VenueEditCustomHallRow[]) => void;
};

export default function EventTypeCustomHallRowsEditor({
  eventType,
  rows,
  inputValue,
  onInputChange,
  onRowsChange,
}: Props) {
  const updateRow = (idx: number, patch: Partial<VenueEditCustomHallRow>) => {
    onRowsChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    const value = inputValue.trim();
    if (!value) return;
    if (rows.length >= 20) return;
    if (rows.some((r) => r.label.toLowerCase() === value.toLowerCase())) return;
    onRowsChange([
      ...rows,
      {
        label: value,
        checked: true,
        priceMode: "included",
        extraPrice: "",
        extraPriceMax: "",
        allowsSeekerExternal: defaultSeekerExternalForCustomRow(),
      },
    ]);
    onInputChange("");
  };

  return (
    <div className="mt-1 border-t border-neutral-200/70 pt-2 sm:col-span-2">
      <p className="mb-2 text-xs font-semibold text-neutral-600">
        מה יש באולם לסוג &quot;{eventType}&quot;? (אופציונלי)
      </p>
      <div className="mb-3 rounded-xl border border-neutral-200/90 bg-white/70 p-3">
        <p className="mb-2 text-[11px] leading-relaxed text-neutral-600">
          פריטים שמופיעים בפנייה רק כשהמחפש בוחר את סוג האירוע הזה. הוסיפו למטה — אפשר לסמן אם מותר
          להביא ספק חיצוני (* אופציונלי).
        </p>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRow();
              }
            }}
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-amber-400"
            placeholder="הוסף פרט משלך לאולם…"
            maxLength={80}
          />
          <button
            type="button"
            onClick={addRow}
            className="shrink-0 rounded-xl border border-[#D4C9BC] px-3 py-2 text-xs text-neutral-800 hover:bg-neutral-50"
          >
            הוסף
          </button>
        </div>
      </div>
      {rows.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows.map((row, idx) => (
            <div
              key={`hall-${eventType}-${row.label}-${idx}`}
              className="flex min-w-0 flex-col gap-2 rounded-lg border border-[#E8E0D6]/80 bg-white/60 px-2 py-2 text-xs text-neutral-800"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <label className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={row.checked}
                    onChange={(e) => updateRow(idx, { checked: e.target.checked })}
                    className="checkbox-hall shrink-0"
                  />
                  <span className="truncate">{row.label}</span>
                </label>
                <select
                  value={row.priceMode}
                  onChange={(e) =>
                    updateRow(idx, {
                      priceMode: e.target.value === "extra" ? "extra" : "included",
                    })
                  }
                  className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px]"
                >
                  <option value="included">כלול</option>
                  <option value="extra">בתוספת תשלום</option>
                </select>
                <button
                  type="button"
                  className="shrink-0 text-[11px] text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
                  onClick={() => onRowsChange(rows.filter((_, i) => i !== idx))}
                >
                  הסר
                </button>
              </div>
              {row.priceMode === "extra" ? (
                <OptionalPriceRangeFields
                  minPrice={row.extraPrice}
                  maxPrice={row.extraPriceMax || row.extraPrice}
                  onChange={(min, max) =>
                    updateRow(idx, { extraPrice: min, extraPriceMax: max })
                  }
                  grouped
                  expandAsButton
                  singleLabel="תוספת תשלום (₪)"
                  minLabel="מינימום (₪)"
                  maxLabel="מקסימום (₪)"
                  expandRangeLabel="אין לך מחיר מדויק? הכנס טווח מחירים"
                  collapseRangeLabel="מחיר קבוע"
                  inputClassName={compactPriceInputClass}
                  className="!p-2"
                />
              ) : null}
              {row.checked ? (
                <SeekerExternalSourceToggle
                  compact
                  checked={row.allowsSeekerExternal}
                  onChange={(next) => updateRow(idx, { allowsSeekerExternal: next })}
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
