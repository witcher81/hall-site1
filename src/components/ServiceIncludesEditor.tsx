"use client";

import type { ServiceCustomInclude } from "@/lib/serviceIncludes";

type Props = {
  includesEquipment: boolean;
  onIncludesEquipment: (v: boolean) => void;
  includesNote: string;
  onIncludesNoteChange: (v: string) => void;
  customIncludes: ServiceCustomInclude[];
  onCustomIncludesChange: (v: ServiceCustomInclude[]) => void;
};

const MAX_CUSTOM = 20;
const MAX_LABEL = 80;
const MAX_NOTE = 500;

export default function ServiceIncludesEditor({
  includesEquipment,
  onIncludesEquipment,
  includesNote,
  onIncludesNoteChange,
  customIncludes,
  onCustomIncludesChange,
}: Props) {
  function addRow() {
    if (customIncludes.length >= MAX_CUSTOM) return;
    onCustomIncludesChange([...customIncludes, { label: "", checked: true }]);
  }

  function updateRow(
    index: number,
    patch: Partial<ServiceCustomInclude>
  ) {
    onCustomIncludesChange(
      customIncludes.map((row, i) =>
        i === index ? { ...row, ...patch } : row
      )
    );
  }

  function removeRow(index: number) {
    onCustomIncludesChange(customIncludes.filter((_, i) => i !== index));
  }

  const checkbox =
    "rounded border-[#E0D4C3] text-[#0F3B2E] focus:ring-[#C9A227]/40";
  const input =
    "flex-1 rounded-lg border border-[#E0D4C3] bg-white px-2 py-1.5 text-xs text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]/40";

  return (
    <div className="rounded-xl border border-[#E0D4C3]/80 bg-[#FAF8F4]/60 p-4 text-right">
      <h3 className="text-sm font-semibold text-[#0F3B2E]">
        מה כלול בשירות
      </h3>
      <p className="mt-1 text-[11px] leading-relaxed text-[#6B6560]">
        סמן/י מה כלול במחיר שמוצג ללקוחות. אפשר להוסיף שורות משלך (למשל: עריכה,
        גיבוי, שעות נוספות).
      </p>

      <div className="mt-3 space-y-2 text-xs text-[#2A261F]">
        <label className="flex flex-wrap items-start gap-2">
          <input
            type="checkbox"
            className={checkbox}
            checked={includesEquipment}
            onChange={(e) => onIncludesEquipment(e.target.checked)}
          />
          <span>
            <span className="font-medium">כולל ציוד</span>
            <span className="mr-1 text-[#6B6560]">
              — ציוד בסיסי שאתה מספק במסגרת ההצעה (ללא עלות נוספת).
            </span>
          </span>
        </label>
      </div>

      <div className="mt-3">
        <label className="block text-[11px] font-medium text-[#5F5F5F]">
          הסבר קצר על מה שכלול (אופציונלי)
        </label>
        <textarea
          dir="rtl"
          rows={3}
          maxLength={MAX_NOTE}
          value={includesNote}
          onChange={(e) =>
            onIncludesNoteChange(e.target.value.slice(0, MAX_NOTE))
          }
          placeholder="למשל: החבילה כוללת צילום עד 6 שעות, גלריה מעובדת ועותק דיגיטלי."
          className="mt-1 w-full rounded-lg border border-[#E0D4C3] bg-white px-3 py-2 text-xs text-[#1A1A1A] outline-none placeholder:text-[#9A948C] focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]/40"
        />
        <p className="mt-0.5 text-[10px] text-[#9A948C]">
          {includesNote.length}/{MAX_NOTE} תווים — יוצג למחפשים מתחת לרשימת &quot;מה כלול&quot;.
        </p>
      </div>

      <div className="mt-4 border-t border-[#E0D4C3]/60 pt-3">
        <p className="text-[11px] font-medium text-[#5F5F5F]">
          שורות נוספות (אופציונלי)
        </p>
        <ul className="mt-2 space-y-2">
          {customIncludes.map((row, index) => (
            <li
              key={index}
              className="flex flex-wrap items-center gap-2 rounded-lg bg-white/80 px-2 py-1.5"
            >
              <label className="flex shrink-0 items-center gap-1.5">
                <input
                  type="checkbox"
                  className={checkbox}
                  checked={row.checked}
                  onChange={(e) =>
                    updateRow(index, { checked: e.target.checked })
                  }
                />
                <span className="sr-only">כלול</span>
              </label>
              <input
                type="text"
                dir="rtl"
                maxLength={MAX_LABEL}
                value={row.label}
                onChange={(e) =>
                  updateRow(index, { label: e.target.value.slice(0, MAX_LABEL) })
                }
                className={input}
                placeholder="למשל: כולל עריכת וידאו בסיסית"
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="shrink-0 rounded-full px-2 py-0.5 text-[11px] text-red-700 hover:bg-red-50"
              >
                הסרה
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addRow}
          disabled={customIncludes.length >= MAX_CUSTOM}
          className="mt-2 rounded-full border border-dashed border-[#0F3B2E]/35 bg-white px-3 py-1.5 text-[11px] font-medium text-[#0F3B2E] hover:bg-[#EFE6D5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          + הוסף שורה ({customIncludes.length}/{MAX_CUSTOM})
        </button>
      </div>
    </div>
  );
}
