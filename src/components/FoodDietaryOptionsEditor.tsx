"use client";

import {
  PRESET_DIETARY_OPTIONS,
  type PresetDietaryOption,
} from "@/lib/foodDietaryOptions";
import { useState } from "react";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export default function FoodDietaryOptionsEditor({ value, onChange }: Props) {
  const [customDraft, setCustomDraft] = useState("");

  function togglePreset(opt: PresetDietaryOption) {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  }

  function addCustom() {
    const t = customDraft.trim();
    if (!t) return;
    if (!value.includes(t)) onChange([...value, t]);
    setCustomDraft("");
  }

  const customTags = value.filter(
    (v) => !(PRESET_DIETARY_OPTIONS as readonly string[]).includes(v)
  );

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 text-right">
      <h3 className="text-sm font-semibold text-emerald-950">
        אופציות כשרות / תזונה מיוחדת
      </h3>
      <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
        אופציונלי. אם יש — סמנו או הוסיפו. לא צריך קטגוריה נפרדת בשביל זה.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESET_DIETARY_OPTIONS.map((opt) => {
          const on = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={on}
              onClick={() => togglePreset(opt)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                on
                  ? "border-emerald-800 bg-emerald-950 text-white"
                  : "border-neutral-200 bg-neutral-50 text-neutral-800 hover:border-amber-400/50"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="text"
          dir="rtl"
          value={customDraft}
          onChange={(e) => setCustomDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          className="min-w-[10rem] flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400"
          placeholder="אופציה נוספת — למשל: ללא לקטוז"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customDraft.trim()}
          className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-emerald-950 hover:bg-neutral-100 disabled:opacity-50"
        >
          הוסף אופציה
        </button>
      </div>

      {customTags.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {customTags.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== tag))}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-950"
              >
                {tag}
                <span aria-hidden>×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
