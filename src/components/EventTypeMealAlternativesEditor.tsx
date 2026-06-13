"use client";

import { useState } from "react";
import { MEAL_ALTERNATIVES_MAX, MEAL_ALTERNATIVE_LABEL_MAX } from "@/lib/venueMealAlternatives";

type Props = {
  alternatives: string[];
  onChange: (next: string[]) => void;
};

export default function EventTypeMealAlternativesEditor({ alternatives, onChange }: Props) {
  const [input, setInput] = useState("");

  const add = () => {
    const value = input.trim().slice(0, MEAL_ALTERNATIVE_LABEL_MAX);
    if (!value) return;
    if (alternatives.length >= MEAL_ALTERNATIVES_MAX) return;
    if (alternatives.some((x) => x.toLowerCase() === value.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...alternatives, value]);
    setInput("");
  };

  return (
    <div className="mt-1 space-y-2 border-t border-neutral-200/70 pt-2 sm:col-span-2">
      <p className="text-xs font-semibold text-neutral-700">שינויים או אפשרויות במנה</p>
      <p className="text-[11px] leading-relaxed text-neutral-600">
        הוסיפו מה האולם מציע מעבר למנה הרגילה — למשל אוכל טבעוני, אוכל צמחוני, ללא גלוטן.
      </p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-amber-400"
          placeholder="למשל: אוכל טבעוני"
          maxLength={MEAL_ALTERNATIVE_LABEL_MAX}
        />
        <button
          type="button"
          onClick={add}
          disabled={alternatives.length >= MEAL_ALTERNATIVES_MAX}
          className="shrink-0 rounded-xl border border-[#D4C9BC] px-3 py-2 text-xs text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
        >
          הוסף
        </button>
      </div>
      {alternatives.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {alternatives.map((label) => (
            <li
              key={label}
              className="flex items-center gap-1.5 rounded-lg border border-[#E8E0D6]/90 bg-white px-2 py-1 text-[11px] text-neutral-800"
            >
              <span>{label}</span>
              <button
                type="button"
                className="text-neutral-500 hover:text-neutral-900"
                aria-label={`הסר ${label}`}
                onClick={() => onChange(alternatives.filter((x) => x !== label))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px] text-neutral-500">לא הוגדרו אפשרויות — אפשר להשאיר ריק.</p>
      )}
    </div>
  );
}
