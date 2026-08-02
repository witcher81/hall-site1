"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearRecentHallSearches,
  listRecentHallSearches,
  recordRecentHallSearch,
  type RecentHallSearch,
} from "@/lib/recentHallSearches";

type Props = {
  /** מחרוזת query של החיפוש הנוכחי (בלי map) — נשמרת אוטומטית כשיש סינון */
  currentQuery: string;
};

export default function RecentHallSearchesPanel({ currentQuery }: Props) {
  const router = useRouter();
  const [recent, setRecent] = useState<RecentHallSearch[]>([]);

  const refresh = useCallback(() => {
    setRecent(listRecentHallSearches());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!currentQuery.trim()) {
      refresh();
      return;
    }
    recordRecentHallSearch(currentQuery);
    refresh();
  }, [currentQuery, refresh]);

  if (recent.length === 0) return null;

  function applySearch(query: string) {
    router.replace(query ? `/halls?${query}` : "/halls", { scroll: false });
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-right shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-emerald-950">חיפושים אחרונים</p>
        <button
          type="button"
          onClick={() => {
            clearRecentHallSearches();
            refresh();
          }}
          className="text-[11px] text-neutral-500 underline underline-offset-2 hover:text-neutral-800"
        >
          נקה
        </button>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {recent.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => applySearch(s.query)}
              className="rounded-full border border-neutral-200 bg-[#FFFCF6] px-3 py-1.5 text-xs font-medium text-emerald-950 transition hover:border-amber-400 hover:bg-amber-50"
            >
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
