"use client";

import { useEffect, useRef, useState } from "react";

const LIST_ID = "venue-address-by-city";
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
  const [options, setOptions] = useState<Suggestion[]>([]);
  const coordsByValueRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const lastPickedRef = useRef<string | null>(null);

  useEffect(() => {
    const c = city.trim();
    const q = value.trim();
    if (c.length < 2 || q.length < 2) {
      setOptions([]);
      coordsByValueRef.current = new Map();
      return;
    }

    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const url = `/api/geocode/suggest?city=${encodeURIComponent(c)}&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { cache: "no-store", signal: ac.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        const list = Array.isArray(data.suggestions) ? data.suggestions : [];
        setOptions(list);
        const m = new Map<string, { lat: number; lng: number }>();
        for (const s of list) {
          m.set(s.value, { lat: s.lat, lng: s.lng });
        }
        coordsByValueRef.current = m;
      } catch {
        if (!ac.signal.aborted) {
          setOptions([]);
          coordsByValueRef.current = new Map();
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      ac.abort();
      window.clearTimeout(t);
    };
  }, [city, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    lastPickedRef.current = null;
    onChange(v);
    const hit = coordsByValueRef.current.get(v);
    if (hit) {
      lastPickedRef.current = v;
      onPickFromList(hit.lat, hit.lng, v);
    }
  };

  const handleBlur = () => {
    const v = value.trim();
    if (v.length >= 2 && lastPickedRef.current !== v) {
      const hit = coordsByValueRef.current.get(v);
      if (hit) {
        lastPickedRef.current = v;
        onPickFromList(hit.lat, hit.lng, v);
      }
    }
    onBlur?.();
  };

  return (
    <>
      <input
        type="text"
        required={required}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={className}
        placeholder={placeholder}
        list={LIST_ID}
        autoComplete="off"
      />
      <datalist id={LIST_ID}>
        {options.map((s) => (
          <option key={`${s.lat.toFixed(5)}-${s.lng.toFixed(5)}-${s.value}`} value={s.value} />
        ))}
      </datalist>
    </>
  );
}
