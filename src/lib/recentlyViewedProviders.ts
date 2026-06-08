import { hasFunctionalConsent } from "@/lib/cookieConsent";

const STORAGE_KEY = "hh-recent-providers";
const MAX_ITEMS = 40;

export type RecentProviderEntry = { id: number; at: number };

function parseList(raw: string | null): RecentProviderEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const id = Number((row as { id?: unknown }).id);
        const at = Number((row as { at?: unknown }).at);
        if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(at)) return null;
        return { id, at };
      })
      .filter((x): x is RecentProviderEntry => x != null);
  } catch {
    return [];
  }
}

export function getRecentProviderIdsOrdered(): number[] {
  if (typeof window === "undefined") return [];
  if (!hasFunctionalConsent()) return [];
  try {
    const list = parseList(window.localStorage.getItem(STORAGE_KEY));
    list.sort((a, b) => b.at - a.at);
    const seen = new Set<number>();
    const ids: number[] = [];
    for (const { id } of list) {
      if (seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
    return ids;
  } catch {
    return [];
  }
}

export function recordProviderRecentlyViewed(providerUserId: number): void {
  if (typeof window === "undefined") return;
  if (!hasFunctionalConsent()) return;
  if (!Number.isInteger(providerUserId) || providerUserId <= 0) return;
  try {
    const list = parseList(window.localStorage.getItem(STORAGE_KEY));
    const next: RecentProviderEntry[] = [
      { id: providerUserId, at: Date.now() },
      ...list.filter((x) => x.id !== providerUserId),
    ].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearRecentProviders(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
