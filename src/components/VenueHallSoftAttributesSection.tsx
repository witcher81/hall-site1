"use client";

import type { VenueSoftAttributeRow } from "@/lib/venueSoftAttributesJson";

/** רק מאפיינים שלא מופיעים בבלוק הגרירה עם תמחור */
export type VenueHallSoftPresetKey = "seaView" | "boutique" | "accessible";

const PRESET_CHECKS: readonly { key: VenueHallSoftPresetKey; label: string }[] = [
  { key: "seaView", label: "נוף לים" },
  { key: "boutique", label: "אירועי בוטיק" },
  { key: "accessible", label: "נגישות לנכים" },
] as const;

const boxClass =
  "flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E7E0CF]/80 bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1A] transition hover:border-[#C9A227]/50";
const cbClass =
  "h-4 w-4 shrink-0 rounded border-[#C9A227] text-[#C9A227] focus:ring-[#C9A227]";

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

  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-[#5F5F5F]">
        מאפייני האולם (ללא תמחור נפרד)
      </p>
      <p className="mb-3 text-[11px] leading-relaxed text-[#6B6560]">
        סימון בלבד — נוף, נגישות וכדומה. פריטים שהמחפש מקבל מהאולם עם בחירת מחיר נמצאים
        בסעיף «מה יש באולם» למטה.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {PRESET_CHECKS.map(({ key, label }) => (
          <label key={key} className={boxClass}>
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

      <div className="mt-4 border-t border-[#E0D4C3]/70 pt-3">
        <p className="mb-2 text-xs font-semibold text-[#5F5F5F]">מאפיינים משלכם (ללא תמחור)</p>
        <p className="mb-2 text-[11px] text-[#6B6560]">
          לדוגמה: גג פתוח, לובי כפול — מוצגים למחפשים בלי «כלול» / «בתוספת תשלום».
        </p>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={customInput}
            onChange={(e) => onCustomInputChange(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#C9A227]"
            placeholder="הוסף מאפיין…"
            maxLength={80}
          />
          <button
            type="button"
            onClick={() => {
              const v = customInput.trim();
              if (!v) return;
              if (customRows.length >= MAX_CUSTOM) return;
              if (customRows.some((r) => r.label.toLowerCase() === v.toLowerCase())) return;
              const id =
                typeof globalThis.crypto !== "undefined" &&
                typeof globalThis.crypto.randomUUID === "function"
                  ? globalThis.crypto.randomUUID()
                  : `sa-${Date.now()}`;
              onCustomRowsChange([...customRows, { id, label: v, on: true }]);
              onCustomInputChange("");
            }}
            className="shrink-0 rounded-xl border border-[#D4C9BC] px-3 py-2 text-xs text-[#2A261F] hover:bg-[#EFE6D5]"
          >
            הוסף
          </button>
        </div>
        {customRows.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {customRows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E8E0D6]/80 bg-white/80 px-3 py-2 text-xs"
              >
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
                  <span className="truncate font-medium text-[#2A261F]">{row.label}</span>
                </label>
                <button
                  type="button"
                  className="shrink-0 text-[11px] text-[#6B6560] underline-offset-2 hover:text-[#1A1A1A] hover:underline"
                  onClick={() => onCustomRowsChange(customRows.filter((r) => r.id !== row.id))}
                >
                  הסר
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
