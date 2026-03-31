/**
 * דירוג ביקורת: 1, 1.5, 2 … 5 (קפיצות של 0.5).
 * משתמש ב-Math.round כדי להימנע משגיאות נקודה צפה (למשל 3.5*2).
 */
export function parseHalfStarRating(
  raw: unknown
): { ok: true; rating: number } | { ok: false } {
  const n = Number(raw);
  if (!Number.isFinite(n)) return { ok: false };
  const steps = Math.round(n * 2);
  if (steps < 2 || steps > 10) return { ok: false };
  return { ok: true, rating: steps / 2 };
}

/** ערך לשמירה ב-DB: 2–10 (כוכבים × 2) */
export function starsToDbScore(stars: number): number {
  const p = parseHalfStarRating(stars);
  if (!p.ok) return 6;
  return Math.round(p.rating * 2);
}

/**
 * קריאה מ-DB לערך כוכבים 1–5:
 * - שמירה חדשה: מספר שלם 2–10 (×2)
 * - legacy: Float ‎1–5‎ מהמסד הישן (לפני המיגרציה)
 */
export function dbScoreToStars(score: number): number {
  if (!Number.isFinite(score)) return 1;
  const intLike = Number.isInteger(score) && score >= 2 && score <= 10;
  if (intLike) return normalizeHalfStarRating(score / 2);
  if (score >= 1 && score <= 5) return normalizeHalfStarRating(score);
  return normalizeHalfStarRating(score / 2);
}

export function normalizeHalfStarRating(r: number): number {
  if (!Number.isFinite(r)) return 1;
  const steps = Math.round(r * 2);
  return Math.min(5, Math.max(1, steps / 2));
}
