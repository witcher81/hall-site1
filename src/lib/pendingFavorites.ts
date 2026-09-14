/** מועדף שנשמר לפני התחברות — מיושם אחרי login בדף היעד */

export type PendingFavorite =
  | { type: "venue"; id: number }
  | { type: "service"; id: number };

const KEY = "efy_pending_favorite";

export function stashPendingFavorite(fav: PendingFavorite): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(fav));
  } catch {
    // ignore quota / private mode
  }
}

export function takePendingFavorite(): PendingFavorite | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as PendingFavorite;
    if (
      (parsed.type === "venue" || parsed.type === "service") &&
      Number.isInteger(parsed.id) &&
      parsed.id > 0
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}
