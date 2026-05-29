"use client";

import type { VenueSoftAttributeRow } from "@/lib/venueSoftAttributesJson";

/** סימונים לחיפוש/תצוגה — לא בבלוק «מה יש באולם» עם מחיר */
export type VenueHallSoftPresetKey = "seaView" | "boutique" | "accessible";

const PRESET_CHECKS: readonly { key: VenueHallSoftPresetKey; label: string }[] = [
  { key: "seaView", label: "נוף לים" },
  { key: "boutique", label: "אירועי בוטיק" },
  { key: "accessible", label: "נגישות לנכים" },
] as const;

const chipClass =
  "relative flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5 text-sm font-medium text-neutral-900 transition hover:border-amber-400/50";
const cbClass =
  "h-4 w-4 shrink-0 rounded border-[#C9A227] text-amber-600 focus:ring-amber-400";

const PRESET_LABELS_LOWER = new Set(
  PRESET_CHECKS.map((p) => p.label.toLowerCase())
);

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

  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-neutral-600">מה מיוחד באולם?</p>
      <p className="mb-3 text-[11px] leading-relaxed text-neutral-600">
        סמנו כאן מה המחפש רואה בחיפוש ובעמוד האולם. אין כאן מחירים — שירותים עם מחיר מוסיפים
        בסעיף «מה יש באולם» למטה.
      </p>

      <p className="mb-2 text-xs font-semibold text-neutral-600">הוסיפו פרט משלכם</p>
      <p className="mb-2 text-[11px] leading-relaxed text-neutral-600">
        לדוגמה: גג פתוח, לובי כפול — אחרי «הוסף» הפריט יופיע בשורה למטה ליד נוף לים, בוטיק
        ונגישות.
      </p>
      <div className="mb-4 rounded-xl border border-neutral-200/90 bg-white/70 p-3">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={customInput}
            onChange={(e) => onCustomInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-amber-400"
            placeholder="הוסף פרט…"
            maxLength={80}
          />
          <button
            type="button"
            onClick={addCustom}
            className="shrink-0 rounded-xl border border-[#D4C9BC] px-3 py-2 text-xs text-neutral-800 hover:bg-neutral-50"
          >
            הוסף
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {customRows.map((row) => (
          <div key={row.id} className={`${chipClass} pe-9`}>
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
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
              <span className="truncate">{row.label}</span>
            </label>
            <button
              type="button"
              title="הסר פריט"
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded px-1 text-[11px] text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              onClick={() => onCustomRowsChange(customRows.filter((r) => r.id !== row.id))}
            >
              הסר
            </button>
          </div>
        ))}
        {PRESET_CHECKS.map(({ key, label }) => (
          <label key={key} className={chipClass}>
            <input
              type="checkbox"
              checked={presetValues[key]}
              onChange={(e) => onPresetChange(key, e.target.checked)}
              className={cbClass}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
