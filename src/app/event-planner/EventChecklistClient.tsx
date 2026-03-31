"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/** גרסה חדשה — מתחילים מרשימה ריקה (לא ממשיכים מ־v2 עם ארבעת ברירות המחדל) */
const STORAGE_KEY = "hh.eventChecklist.v3";

type Row = { id: string; label: string; done: boolean };

/** רק הצעות ללחיצה — לא נטענות אוטומטית לרשימה */
const QUICK_ADD_SUGGESTIONS = [
  "אולם",
  "צלם",
  "DJ",
  "קייטרינג",
  "עיצוב פרחים",
  "תזמורת / חי",
  "הזמנות",
  "איפור ושיער",
  "בר אלכוהול",
  "עוגה",
  "חניה / שאטל",
  "אבטחה",
] as const;

function loadRows(): Row[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as { items?: unknown };
    if (!Array.isArray(data.items)) return [];
    return data.items
      .filter(
        (x): x is Row =>
          x &&
          typeof x === "object" &&
          typeof (x as Row).id === "string" &&
          typeof (x as Row).label === "string" &&
          typeof (x as Row).done === "boolean"
      )
      .map((r) => ({ ...r, label: r.label.trim() || "פריט" }));
  } catch {
    return [];
  }
}

function saveRows(items: Row[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  } catch {
    /* ignore */
  }
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function EventChecklistClient() {
  const [items, setItems] = useState<Row[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    setItems(loadRows());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: Row[]) => {
    setItems(next);
    saveRows(next);
  }, []);

  const doneCount = useMemo(() => items.filter((i) => i.done).length, [items]);
  const total = items.length;

  function toggle(id: string) {
    persist(items.map((r) => (r.id === id ? { ...r, done: !r.done } : r)));
  }

  function addItem() {
    const label = newLabel.trim();
    if (!label) return;
    persist([...items, { id: newId(), label, done: false }]);
    setNewLabel("");
  }

  function labelExists(label: string): boolean {
    const t = label.trim();
    return items.some((r) => r.label.trim() === t);
  }

  function addQuickLabel(label: string) {
    const t = label.trim();
    if (!t || labelExists(t)) return;
    persist([...items, { id: newId(), label: t, done: false }]);
  }

  function removeItem(id: string) {
    persist(items.filter((r) => r.id !== id));
  }

  function clearAll() {
    if (!confirm("למחוק את כל השלבים מהרשימה?")) return;
    persist([]);
  }

  if (!hydrated) {
    return (
      <div className="mt-8 h-64 animate-pulse rounded-2xl border border-[#E0D4C3] bg-white/60" />
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E0D4C3] bg-white px-4 py-3 text-right shadow-sm">
        <div>
          <p className="text-sm font-semibold text-[#0F3B2E]">התקדמות</p>
          <p className="text-xs text-[#6B6560]">
            {total === 0
              ? "עדיין אין שלבים — הוסיפו מהרשימה למטה"
              : `${doneCount} מתוך ${total} סומנו כהושלמו`}
          </p>
        </div>
        <div className="h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-[#E8E0D4] sm:max-w-xs">
          <div
            className="h-full rounded-full bg-[#C9A227] transition-all duration-300"
            style={{ width: total ? `${(doneCount / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      <ul className="space-y-2" aria-label="רשימת משימות לאירוע">
        {total === 0 && (
          <li className="rounded-2xl border-2 border-dashed border-[#C9A227]/40 bg-[#FFFBF0] px-4 py-8 text-center text-sm text-[#6B6560]">
            <p className="font-medium text-[#0F3B2E]">הרשימה שלך ריקה</p>
            <p className="mt-2 text-xs leading-relaxed">
              בחרו שלבים מהרשימה המוצעת למטה, או כתבו שלב משלכם בשדה החופשי.
            </p>
          </li>
        )}
        {items.map((row) => (
          <li
            key={row.id}
            className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-right transition sm:px-4 ${
              row.done
                ? "border-emerald-500/40 bg-emerald-50/80"
                : "border-[#E0D4C3] bg-[#FDFBF7]"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(row.id)}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] ${
                row.done
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "border-2 border-rose-400 bg-white text-rose-600"
              }`}
              aria-pressed={row.done}
              aria-label={row.done ? `סמן ${row.label} כלא בוצע` : `סמן ${row.label} כבוצע`}
            >
              {row.done ? "✔" : "✕"}
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={`text-base font-semibold ${
                  row.done ? "text-emerald-900 line-through opacity-80" : "text-[#0F3B2E]"
                }`}
              >
                {row.label}
              </p>
              <p className="text-[11px] text-[#8A806F]">
                {row.done ? "סגור" : "עדיין לטיפול"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeItem(row.id)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-700/90 hover:bg-red-50"
              aria-label={`הסר ${row.label}`}
            >
              הסר
            </button>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-[#E0D4C3] bg-white p-4 text-right shadow-sm">
        <p className="text-sm font-semibold text-[#0F3B2E]">הוספה מהירה — רעיונות נפוצים</p>
        <p className="mt-1 text-xs text-[#6B6560]">לחיצה מוסיפה שלב לרשימה (לא יוסיף כפול מאותו שם).</p>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {QUICK_ADD_SUGGESTIONS.map((s) => {
            const taken = labelExists(s);
            return (
              <button
                key={s}
                type="button"
                disabled={taken}
                onClick={() => addQuickLabel(s)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  taken
                    ? "cursor-not-allowed border-[#E0D4C3] bg-[#F0EBE3] text-[#A8A098]"
                    : "border-[#0F3B2E]/25 bg-[#FAF8F4] text-[#0F3B2E] hover:border-[#C9A227] hover:bg-[#FFFBF0]"
                }`}
              >
                {taken ? `${s} ✓` : `+ ${s}`}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[#E0D4C3] bg-white p-4 text-right shadow-sm">
        <p className="text-sm font-semibold text-[#0F3B2E]">שלב משלכם (טקסט חופשי)</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <input
            type="text"
            dir="rtl"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="למשל: עיצוב פרחים, תסרוקת…"
            className="min-h-[48px] flex-1 rounded-xl border-2 border-[#E0D4C3] bg-[#FAF8F4] px-3 py-2 text-sm outline-none focus:border-[#C9A227]"
          />
          <button
            type="button"
            onClick={addItem}
            className="min-h-[48px] rounded-xl bg-[#0F3B2E] px-5 text-sm font-bold text-white hover:bg-[#174D3B]"
          >
            הוסף
          </button>
        </div>
      </div>

      {total > 0 && (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-800 hover:bg-red-50"
          >
            ניקוי כל הרשימה
          </button>
        </div>
      )}

      <p className="text-center text-[11px] text-[#8A806F]">
        הרשימה נשמרת במכשיר הזה (דפדפן). התחברות מאותו דפדפן תשמור את אותה רשימה.
      </p>
    </div>
  );
}
