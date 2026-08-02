import { hasFunctionalConsent } from "@/lib/cookieConsent";

const STORAGE_KEY = "hh-recent-hall-searches";
const MAX_RECENT = 8;

export type RecentHallSearch = {
  id: string;
  label: string;
  query: string;
  searchedAt: number;
};

function parseList(raw: string | null): RecentHallSearch[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const id = String((row as { id?: unknown }).id ?? "");
        const label = String((row as { label?: unknown }).label ?? "").trim();
        const query = String((row as { query?: unknown }).query ?? "");
        const searchedAt = Number((row as { searchedAt?: unknown }).searchedAt);
        if (!id || !label || !query || !Number.isFinite(searchedAt)) return null;
        return { id, label, query, searchedAt };
      })
      .filter((x): x is RecentHallSearch => x != null);
  } catch {
    return [];
  }
}

/** תווית קריאה מפרמטרי החיפוש */
export function labelFromHallSearchQuery(query: string): string {
  const p = new URLSearchParams(query);
  const parts: string[] = [];
  const q = p.get("q")?.trim();
  const city = p.get("city")?.trim();
  const eventType = p.get("eventType")?.trim();
  const minGuests = p.get("minGuests")?.trim();
  const maxGuests = p.get("maxGuests")?.trim();
  if (eventType) parts.push(eventType);
  if (city) parts.push(city);
  if (q) parts.push(`«${q}»`);
  if (minGuests || maxGuests) {
    parts.push(`${minGuests || "?"}–${maxGuests || "?"} אורחים`);
  }
  if (parts.length === 0) return "חיפוש אולמות";
  return parts.join(" · ");
}

export function listRecentHallSearches(): RecentHallSearch[] {
  if (typeof window === "undefined" || !hasFunctionalConsent()) return [];
  try {
    const list = parseList(window.localStorage.getItem(STORAGE_KEY));
    list.sort((a, b) => b.searchedAt - a.searchedAt);
    return list.slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

/** נשמר אוטומטית כשהמשתמש מבצע חיפוש (עם סינון) */
export function recordRecentHallSearch(query: string): RecentHallSearch | null {
  if (typeof window === "undefined" || !hasFunctionalConsent()) return null;
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const label = labelFromHallSearchQuery(trimmed);
    const list = parseList(window.localStorage.getItem(STORAGE_KEY));
    const entry: RecentHallSearch = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      query: trimmed,
      searchedAt: Date.now(),
    };
    const next = [
      entry,
      ...list.filter((s) => s.query !== entry.query),
    ].slice(0, MAX_RECENT);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return entry;
  } catch {
    return null;
  }
}

export function clearRecentHallSearches(): void {
  if (typeof window === "undefined" || !hasFunctionalConsent()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
