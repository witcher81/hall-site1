"use client";

import { useMemo, useState } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  categories: readonly string[];
  label?: string;
};

export default function FreelancerCategoryPicker({
  value,
  onChange,
  categories,
  label = "קטגוריה",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.toLowerCase().includes(q) || c.includes(query.trim()));
  }, [categories, query]);

  return (
    <div>
      <label className="block text-xs font-medium text-neutral-600">{label}</label>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2 text-right text-sm text-neutral-900 outline-none hover:border-amber-400/70 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
      >
        <span>{value || "בחר קטגוריה"}</span>
        <span className="text-xs text-neutral-600">פתח רשימה</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-emerald-950">בחירת קטגוריה</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
              >
                סגור
              </button>
            </div>

            <input
              type="text"
              dir="rtl"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש קטגוריה..."
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
            />

            <div className="mt-3 max-h-[55vh] overflow-y-auto rounded-xl border border-[#E8E0D4] bg-neutral-50/70 p-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`rounded-xl border px-3 py-2 text-right text-sm transition ${
                    value === ""
                      ? "border-[#C9A227] bg-[#FFF7DD] text-emerald-950"
                      : "border-neutral-200 bg-white text-neutral-900 hover:border-amber-400/70"
                  }`}
                >
                  ללא קטגוריה
                </button>
                {filtered.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`rounded-xl border px-3 py-2 text-right text-sm transition ${
                      value === c
                        ? "border-[#C9A227] bg-[#FFF7DD] text-emerald-950"
                        : "border-neutral-200 bg-white text-neutral-900 hover:border-amber-400/70"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {filtered.length === 0 ? (
                <p className="p-3 text-xs text-neutral-600">לא נמצאו קטגוריות לחיפוש הזה.</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

