"use client";

import type { VenueSoftAttributeRow } from "@/lib/venueSoftAttributesJson";
import {
  VenueAddItemsInputRow,
  VenueAddItemsPanel,
  VenueItemsTable,
  VenueItemsTableRemoveButton,
  VenueItemsTableRow,
} from "@/components/VenueAddItemsTable";
import {
  VENUE_HALL_SOFT_PRESETS,
  type VenueHallSoftPresetKey,
} from "@/lib/venueHallSoftPresets";

export type { VenueHallSoftPresetKey };

const PRESET_CHECKS = VENUE_HALL_SOFT_PRESETS;

const PRESET_LABELS_LOWER = new Set(
  PRESET_CHECKS.map((p) => p.label.toLowerCase())
);

const cbClass =
  "checkbox-hall shrink-0";

type Props = {
  presetValues: Record<VenueHallSoftPresetKey, boolean>;
  onPresetChange: (key: VenueHallSoftPresetKey, checked: boolean) => void;
  customRows: VenueSoftAttributeRow[];
  onCustomRowsChange: (rows: VenueSoftAttributeRow[]) => void;
  customInput: string;
  onCustomInputChange: (v: string) => void;
};

export default function VenueHallSoftAttributesSection({
  presetValues,
  onPresetChange,
  customRows,
  onCustomRowsChange,
  customInput,
  onCustomInputChange,
}: Props) {
  const MAX_CUSTOM = 25;

  const addCustom = () => {
    const v = customInput.trim();
    if (!v) return;
    if (customRows.length >= MAX_CUSTOM) return;
    const vLower = v.toLowerCase();
    if (PRESET_LABELS_LOWER.has(vLower)) return;
    if (customRows.some((r) => r.label.toLowerCase() === vLower)) return;
    const id =
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `sa-${Date.now()}`;
    onCustomRowsChange([{ id, label: v, on: true }, ...customRows]);
    onCustomInputChange("");
  };

  const hasTableRows = customRows.length > 0 || PRESET_CHECKS.length > 0;

  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-neutral-600">מה מיוחד באולם?</p>
      <p className="mb-3 text-[11px] leading-relaxed text-neutral-600">
        סמנו כאן מה המחפש רואה בחיפוש ובעמוד האולם. אין כאן מחירים — שירותים עם מחיר מוסיפים
        בסעיף «מה יש באולם» למטה.
      </p>

      <p className="mb-2 text-xs font-semibold text-neutral-600">הוסיפו פרט משלכם</p>
      <VenueAddItemsPanel
        hint={
          <>
            לדוגמה: גג פתוח, לובי כפול — אחרי «הוסף» הפריט יופיע בטבלה למטה ליד גינה/חצר, אירועים
            קטנים ונגישות.
          </>
        }
      >
        <VenueAddItemsInputRow
          value={customInput}
          onChange={onCustomInputChange}
          onAdd={addCustom}
          placeholder="הוסף פרט…"
          maxLength={80}
          disabled={customRows.length >= MAX_CUSTOM}
        />
      </VenueAddItemsPanel>

      {hasTableRows ? (
        <VenueItemsTable>
          {customRows.map((row) => (
            <VenueItemsTableRow key={row.id}>
              <label className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.on}
                  onChange={(e) =>
                    onCustomRowsChange(
                      customRows.map((r) =>
                        r.id === row.id ? { ...r, on: e.target.checked } : r
                      )
                    )
                  }
                  className={cbClass}
                />
                <span className="truncate font-medium">{row.label}</span>
              </label>
              <VenueItemsTableRemoveButton
                label="הסר"
                onClick={() => onCustomRowsChange(customRows.filter((r) => r.id !== row.id))}
              />
            </VenueItemsTableRow>
          ))}
          {PRESET_CHECKS.map(({ key, label }) => (
            <VenueItemsTableRow key={key}>
              <label className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  checked={presetValues[key]}
                  onChange={(e) => onPresetChange(key, e.target.checked)}
                  className={cbClass}
                />
                <span className="font-medium">{label}</span>
              </label>
            </VenueItemsTableRow>
          ))}
        </VenueItemsTable>
      ) : null}
    </div>
  );
}
