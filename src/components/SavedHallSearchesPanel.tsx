"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteSavedHallSearch,
  listSavedHallSearches,
  saveHallSearch,
  type SavedHallSearch,
} from "@/lib/savedHallSearches";

type Props = {
  currentQuery: string;
};

export default function SavedHallSearchesPanel({ currentQuery }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState<SavedHallSearch[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSaved(listSavedHallSearches());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleSave() {
    if (!currentQuery.trim()) {
      setMessage("הגדירו סינון לפני שמירה.");
      return;
    }
    const entry = saveHallSearch(name || "חיפוש שמור", currentQuery);
    if (!entry) {
      setMessage("לא ניתן לשמור — בדקו הגדרות עוגיות.");
      return;
    }
    setName("");
    setMessage("החיפוש נשמר.");
    refresh();
  }

  function applySearch(query: string) {
    router.replace(query ? `/halls?${query}` : "/halls", { scroll: false });
  }

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4 text-right">
      <p className="text-sm font-semibold text-emerald-950">חיפושים שמורים</p>
      <p className="mt-1 text-xs text-neutral-600">
        שמרו את הסינון הנוכחי בשם — נטען מהמכשיר שלכם.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם לחיפוש (למשל: חתונה ת״א 150)"
          className="min-h-[42px] flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleSave}
          className="rounded-full bg-emerald-950 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
        >
          שמור חיפוש
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-neutral-600">{message}</p> : null}
      {saved.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {saved.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2"
            >
              <button
                type="button"
                onClick={() => applySearch(s.query)}
                className="min-w-0 flex-1 truncate text-right text-xs font-medium text-emerald-950 hover:underline"
              >
                {s.name}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSavedHallSearch(s.id);
                  refresh();
                }}
                className="shrink-0 text-[10px] text-red-600 hover:underline"
                aria-label={`מחק ${s.name}`}
              >
                מחק
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-neutral-500">אין חיפושים שמורים עדיין.</p>
      )}
    </div>
  );
}
