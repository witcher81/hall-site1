"use client";

import {
  parseServiceLanguagesToTags,
  serializeServiceLanguagesTags,
  SERVICE_LANGUAGES_MAX_CHARS,
  SERVICE_WORK_LANGUAGES_PRESET_HE,
} from "@/lib/serviceLanguagesCatalog";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (serialized: string) => void;
  /** מחלקות לשדה ההזנה החופשית (למשל אותו `input` כמו בשאר הטופס) */
  inputClassName: string;
};

export default function ServiceLanguagesTagsField({
  value,
  onChange,
  inputClassName,
}: Props) {
  const tags = useMemo(() => parseServiceLanguagesToTags(value), [value]);
  const [draft, setDraft] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [pickerOpen]);

  function tryAddTag(raw: string) {
    const t = raw.trim();
    if (!t) return;
    const lower = t.toLowerCase();
    if (tags.some((x) => x.toLowerCase() === lower)) return;
    const nextTags = [...tags, t];
    const serialized = serializeServiceLanguagesTags(nextTags);
    if (serialized.length > SERVICE_LANGUAGES_MAX_CHARS) return;
    onChange(serialized);
  }

  function removeAt(index: number) {
    onChange(serializeServiceLanguagesTags(tags.filter((_, j) => j !== index)));
  }

  const availablePresets = useMemo(
    () =>
      SERVICE_WORK_LANGUAGES_PRESET_HE.filter(
        (l) => !tags.some((t) => t.toLowerCase() === l.toLowerCase())
      ),
    [tags]
  );

  const remainingChars = SERVICE_LANGUAGES_MAX_CHARS - value.trim().length;

  return (
    <div className="space-y-2">
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-[#E0D4C3] bg-[#FAF8F4] px-2.5 py-1 text-xs text-[#0F3B2E]"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="rounded-full px-1 text-[#6B6560] hover:bg-[#EFE6D5] hover:text-[#1A1A1A]"
                aria-label={`הסרת ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div ref={wrapRef} className="relative flex flex-wrap items-start gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className="shrink-0 rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs font-medium text-[#0F3B2E] outline-none hover:border-[#C9A227] focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
          aria-expanded={pickerOpen}
          aria-haspopup="listbox"
        >
          בחר מהרשימה
        </button>
        {pickerOpen && (
          <ul
            role="listbox"
            className="absolute right-0 top-full z-30 mt-1 max-h-52 w-full min-w-[220px] max-w-sm overflow-y-auto rounded-xl border border-[#E0D4C3] bg-white py-1 text-right text-sm shadow-lg"
          >
            {availablePresets.length === 0 ? (
              <li className="px-3 py-2 text-xs text-[#6B6560]">כל השפות מהרשימה כבר נוספו</li>
            ) : (
              availablePresets.map((lang) => (
                <li key={lang} role="option">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-right text-[#1A1A1A] hover:bg-[#FAF8F4]"
                    onClick={() => {
                      tryAddTag(lang);
                      setPickerOpen(false);
                    }}
                  >
                    {lang}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              tryAddTag(draft);
              setDraft("");
            }
          }}
          className={inputClassName}
          placeholder="הזינו שפה ולחצו Enter או «הוסף»"
          maxLength={120}
        />
        <button
          type="button"
          onClick={() => {
            tryAddTag(draft);
            setDraft("");
          }}
          className="shrink-0 rounded-xl border border-[#0F3B2E]/25 bg-[#0F3B2E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#174D3B]"
        >
          הוסף
        </button>
      </div>
      <p className="text-[11px] text-[#6B6560]">
        ניתן לבחור מהרשימה או להקליד שפה משלכם — כל שפה מוצגת כתג. נשארו{" "}
        {Math.max(0, remainingChars)} תווים מתוך {SERVICE_LANGUAGES_MAX_CHARS}.
      </p>
    </div>
  );
}
