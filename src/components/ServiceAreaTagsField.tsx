"use client";

import {
  parseServiceAreasToTags,
  serializeServiceAreaTags,
  SERVICE_AREA_MAX_CHARS,
  SERVICE_AREA_PRESET_HE,
} from "@/lib/serviceAreaCatalog";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (serialized: string) => void;
  className?: string;
};

export default function ServiceAreaTagsField({
  value,
  onChange,
  className = "",
}: Props) {
  const ALL_COUNTRY_LABEL = "כל הארץ";
  const tags = useMemo(() => parseServiceAreasToTags(value), [value]);
  const [draft, setDraft] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAllCountry = tags.some((t) => t.toLowerCase() === ALL_COUNTRY_LABEL.toLowerCase());

  const availablePresets = useMemo(
    () =>
      SERVICE_AREA_PRESET_HE.filter(
        (l) => !tags.some((t) => t.toLowerCase() === l.toLowerCase())
      ),
    [tags]
  );

  const filteredPresets = useMemo(() => {
    const q = draft.trim();
    if (!q) return [...availablePresets];
    const ql = q.toLowerCase();
    return availablePresets.filter(
      (l) => l.includes(q) || l.toLowerCase().includes(ql)
    );
  }, [availablePresets, draft]);

  useEffect(() => {
    if (!listOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setListOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [listOpen]);

  useEffect(() => {
    if (activeIndex >= filteredPresets.length) {
      setActiveIndex(filteredPresets.length > 0 ? filteredPresets.length - 1 : -1);
    }
  }, [activeIndex, filteredPresets.length]);

  function tryAddTag(raw: string) {
    const t = raw.trim();
    if (!t) return;
    const lower = t.toLowerCase();
    if (tags.some((x) => x.toLowerCase() === lower)) return;
    if (hasAllCountry && lower !== ALL_COUNTRY_LABEL.toLowerCase()) return;
    const nextTags =
      lower === ALL_COUNTRY_LABEL.toLowerCase() ? [ALL_COUNTRY_LABEL] : [...tags, t];
    const serialized = serializeServiceAreaTags(nextTags);
    if (serialized.length > SERVICE_AREA_MAX_CHARS) return;
    onChange(serialized);
  }

  function removeAt(index: number) {
    onChange(serializeServiceAreaTags(tags.filter((_, j) => j !== index)));
  }

  function pickPreset(area: string) {
    tryAddTag(area);
    setDraft("");
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setListOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setListOpen(true);
      setActiveIndex((i) =>
        filteredPresets.length === 0 ? -1 : i < filteredPresets.length - 1 ? i + 1 : 0
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setListOpen(true);
      setActiveIndex((i) => {
        if (filteredPresets.length === 0) return -1;
        if (i <= 0) return filteredPresets.length - 1;
        return i - 1;
      });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (listOpen && activeIndex >= 0 && activeIndex < filteredPresets.length) {
        pickPreset(filteredPresets[activeIndex]!);
        return;
      }
      tryAddTag(draft);
      setDraft("");
      setActiveIndex(-1);
    }
  }

  const showList = listOpen && (filteredPresets.length > 0 || draft.trim().length > 0);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div
        ref={wrapRef}
        className="rounded-xl border border-[#E0D4C3] bg-white text-right shadow-sm focus-within:border-[#C9A227] focus-within:ring-2 focus-within:ring-[#C9A227]/40"
      >
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 border-b border-[#E0D4C3]/50 px-2 py-2">
            {tags.map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="inline-flex items-center gap-1 rounded-full border border-[#E0D4C3] bg-[#FAF8F4] px-2.5 py-0.5 text-xs text-[#0F3B2E]"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="rounded-full px-0.5 text-[#6B6560] hover:bg-[#EFE6D5] hover:text-[#1A1A1A]"
                  aria-label={`הסרת ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => {
                onChange("");
                setDraft("");
                setListOpen(false);
                setActiveIndex(-1);
              }}
              className="mr-auto rounded-full border border-[#E0D4C3] bg-white px-2.5 py-0.5 text-[11px] text-[#5F5F5F] hover:bg-[#FAF8F4]"
            >
              נקה הכל
            </button>
          </div>
        ) : null}

        <div className="flex items-stretch gap-1 pe-1 ps-2">
          <input
            ref={inputRef}
            type="text"
            dir="rtl"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setListOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setListOpen(true)}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-[#1A1A1A] outline-none placeholder:text-[#9A9490]"
            placeholder={
              hasAllCountry
                ? "נבחר 'כל הארץ' — להסרתו לחצו × או 'נקה הכל'"
                : "הקלידו אזור שירות או בחרו מהרשימה למטה…"
            }
            maxLength={120}
            aria-expanded={listOpen}
            aria-controls="service-area-suggestions"
            aria-autocomplete="list"
          />
          {draft.trim() !== "" ? (
            <button
              type="button"
              onClick={() => {
                tryAddTag(draft);
                setDraft("");
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
              className="shrink-0 self-center rounded-lg px-2 py-1 text-xs font-semibold text-[#0F3B2E] hover:bg-[#FAF8F4]"
            >
              הוסף
            </button>
          ) : null}
        </div>

        {showList ? (
          <ul
            id="service-area-suggestions"
            role="listbox"
            className="max-h-44 overflow-y-auto border-t border-[#E0D4C3]/50 py-1"
          >
            {filteredPresets.length === 0 ? (
              <li className="px-3 py-2 text-xs text-[#6B6560]">
                אין התאמה ברשימה — לחצו «הוסף» או Enter להוספת מה שהקלדתם
              </li>
            ) : (
              filteredPresets.map((area, i) => (
                <li key={area} role="option" aria-selected={i === activeIndex}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-right text-sm text-[#1A1A1A] hover:bg-[#FAF8F4] ${
                      i === activeIndex ? "bg-[#FAF8F4]" : ""
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickPreset(area)}
                  >
                    {area}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

