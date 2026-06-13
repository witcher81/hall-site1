import { hasFunctionalConsent } from "@/lib/cookieConsent";

const STORAGE_KEY = "hh-saved-hall-searches";
const MAX_SAVED = 12;

export type SavedHallSearch = {
  id: string;
  name: string;
  query: string;
  savedAt: number;
};

function parseList(raw: string | null): SavedHallSearch[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const id = String((row as { id?: unknown }).id ?? "");
        const name = String((row as { name?: unknown }).name ?? "").trim();
        const query = String((row as { query?: unknown }).query ?? "");
        const savedAt = Number((row as { savedAt?: unknown }).savedAt);
        if (!id || !name || !query || !Number.isFinite(savedAt)) return null;
        return { id, name, query, savedAt };
      })
      .filter((x): x is SavedHallSearch => x != null);
  } catch {
    return [];
  }
}

export function listSavedHallSearches(): SavedHallSearch[] {
  if (typeof window === "undefined" || !hasFunctionalConsent()) return [];
  try {
    const list = parseList(window.localStorage.getItem(STORAGE_KEY));
    list.sort((a, b) => b.savedAt - a.savedAt);
    return list.slice(0, MAX_SAVED);
  } catch {
    return [];
  }
}

export function saveHallSearch(name: string, query: string): SavedHallSearch | null {
  if (typeof window === "undefined" || !hasFunctionalConsent()) return null;
  const trimmed = name.trim();
  if (!trimmed || !query.trim()) return null;
  try {
    const list = parseList(window.localStorage.getItem(STORAGE_KEY));
    const entry: SavedHallSearch = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmed,
      query: query.trim(),
      savedAt: Date.now(),
    };
    const next = [entry, ...list.filter((s) => s.query !== entry.query)].slice(0, MAX_SAVED);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return entry;
  } catch {
    return null;
  }
}

export function deleteSavedHallSearch(id: string): void {
  if (typeof window === "undefined" || !hasFunctionalConsent()) return;
  try {
    const list = parseList(window.localStorage.getItem(STORAGE_KEY)).filter((s) => s.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
