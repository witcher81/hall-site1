"use client";

import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
import SeekerExternalSourceToggle from "@/components/SeekerExternalSourceToggle";
import {
  VenueAddItemsInputRow,
  VenueAddItemsPanel,
  VenueItemsTable,
  VenueItemsTableRemoveButton,
  VenueItemsTableRow,
} from "@/components/VenueAddItemsTable";
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
        allowsSeekerExternalEventTypes: [],
      },
    ]);
    onInputChange("");
  };

  return (
    <div className="mt-1 border-t border-neutral-200/70 pt-2 sm:col-span-2">
      <p className="mb-2 text-xs font-semibold text-neutral-600">
        מה יש באולם לסוג &quot;{eventType}&quot;? (אופציונלי)
      </p>
      <VenueAddItemsPanel
        hint={
          <>
            פריטים שמופיעים בפנייה רק כשהמחפש בוחר את סוג האירוע הזה. הוסיפו למטה — אפשר לסמן אם
            מותר להביא ספק חיצוני (* אופציונלי).
          </>
        }
      >
        <VenueAddItemsInputRow
          value={inputValue}
          onChange={onInputChange}
          onAdd={addRow}
          placeholder="הוסף פרט משלך לאולם…"
          maxLength={80}
        />
      </VenueAddItemsPanel>
      {rows.length > 0 ? (
        <VenueItemsTable>
          {rows.map((row, idx) => (
          <VenueItemsTableRow key={`hall-${eventType}-${row.label}-${idx}`}>
            <label className="flex min-w-0 flex-1 items-center gap-2">
              <input
                type="checkbox"
                checked={row.checked}
                onChange={(e) => updateRow(idx, { checked: e.target.checked })}
                className="checkbox-hall shrink-0"
              />
              <span className="truncate font-medium">{row.label}</span>
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
            <VenueItemsTableRemoveButton
              label="הסר"
              onClick={() => onRowsChange(rows.filter((_, i) => i !== idx))}
            />
            {row.priceMode === "extra" ? (
              <div className="w-full basis-full" data-amenity-no-drag>
                <OptionalPriceRangeFields
                  key={`${eventType}-${idx}-extra`}
                  minPrice={row.extraPrice}
                  maxPrice={row.extraPriceMax}
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
              </div>
            ) : null}
            {row.checked ? (
              <div className="w-full basis-full" data-amenity-no-drag>
                <SeekerExternalSourceToggle
                  compact
                  checked={row.allowsSeekerExternal}
                  onChange={(next) => updateRow(idx, { allowsSeekerExternal: next })}
                />
              </div>
            ) : null}
          </VenueItemsTableRow>
        ))}
        </VenueItemsTable>
      ) : null}
    </div>
  );
}
