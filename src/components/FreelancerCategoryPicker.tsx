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
      <label className="block text-xs font-medium text-[#5F5F5F]">{label}</label>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 flex w-full items-center justify-between rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-right text-sm text-[#1A1A1A] outline-none hover:border-[#C9A227]/70 focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
      >
        <span>{value || "בחר קטגוריה"}</span>
        <span className="text-xs text-[#6B6560]">פתח רשימה</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#E0D4C3] bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#0F3B2E]">בחירת קטגוריה</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[#E0D4C3] px-3 py-1 text-xs text-[#5F5F5F] hover:bg-[#FAF8F4]"
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
              className="w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
            />

            <div className="mt-3 max-h-[55vh] overflow-y-auto rounded-xl border border-[#E8E0D4] bg-[#FAF8F4]/70 p-2">
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
                      ? "border-[#C9A227] bg-[#FFF7DD] text-[#0F3B2E]"
                      : "border-[#E0D4C3] bg-white text-[#1A1A1A] hover:border-[#C9A227]/70"
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
                        ? "border-[#C9A227] bg-[#FFF7DD] text-[#0F3B2E]"
                        : "border-[#E0D4C3] bg-white text-[#1A1A1A] hover:border-[#C9A227]/70"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {filtered.length === 0 ? (
                <p className="p-3 text-xs text-[#6B6560]">לא נמצאו קטגוריות לחיפוש הזה.</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

