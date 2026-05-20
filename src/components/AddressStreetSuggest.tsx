"use client";

import { useEffect, useId, useRef, useState } from "react";

const DEBOUNCE_MS = 400;

type Suggestion = { value: string; lat: number; lng: number };

type Props = {
  city: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  /** כשנבחרה הצעה מהרשימה — קואורדינטות + הערך בשדה */
  onPickFromList: (lat: number, lng: number, addressValue: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
};

export default function AddressStreetSuggest({
  city,
  value,
  onChange,
  onBlur,
  onPickFromList,
  className,
  placeholder = "רחוב, מספר",
  required,
}: Props) {
  const listboxId = useId();
  const [options, setOptions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(value);
  const [activeIndex, setActiveIndex] = useState(-1);
  const lastPickedRef = useRef<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const suggestReqRef = useRef(0);

  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);

  useEffect(() => {
    const c = city.trim();
    const q = (focused ? draft : value).trim();
    if (c.length < 2 || q.length < 2) {
      setOptions([]);
      return;
    }

    const reqId = ++suggestReqRef.current;
    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const url = `/api/geocode/suggest?city=${encodeURIComponent(c)}&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { cache: "no-store", signal: ac.signal });
        if (!res.ok || reqId !== suggestReqRef.current) return;
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        if (reqId !== suggestReqRef.current) return;
        const list = Array.isArray(data.suggestions) ? data.suggestions : [];
        setOptions(list);
        setActiveIndex(-1);
      } catch {
        if (!ac.signal.aborted && reqId === suggestReqRef.current) {
          setOptions([]);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      ac.abort();
      window.clearTimeout(t);
    };
  }, [city, value, draft, focused]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pickSuggestion = (s: Suggestion) => {
    lastPickedRef.current = s.value;
    setDraft(s.value);
    onChange(s.value);
    onPickFromList(s.lat, s.lng, s.value);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    lastPickedRef.current = null;
    setDraft(v);
    onChange(v);
    setOpen(true);
  };

  const handleBlur = () => {
    setFocused(false);
    setOpen(false);
    const v = draft.trim();
    if (v.length >= 2 && lastPickedRef.current !== v) {
      const hit = options.find((s) => s.value === v);
      if (hit) {
        lastPickedRef.current = hit.value;
        onChange(hit.value);
        onPickFromList(hit.lat, hit.lng, hit.value);
      }
    }
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || options.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pickSuggestion(options[activeIndex]!);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showList = open && focused && options.length > 0 && draft.trim().length >= 2;

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        required={required}
        value={focused ? draft : value}
        onChange={handleChange}
        onFocus={() => {
          setFocused(true);
          setDraft(value);
          setOpen(true);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? listboxId : undefined}
        aria-autocomplete="list"
      />
      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-[#E0D4C3] bg-white py-1 text-sm shadow-lg"
        >
          {options.map((s, i) => (
            <li
              key={`${s.lat.toFixed(5)}-${s.lng.toFixed(5)}-${s.value}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`cursor-pointer px-3 py-2 text-[#1A1A1A] hover:bg-[#FAF8F4] ${
                i === activeIndex ? "bg-[#FAF8F4]" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                pickSuggestion(s);
              }}
            >
              {s.value}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
