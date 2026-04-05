/**
 * הגנה מפני XSS דרך מאפייני href (javascript:, data:, נתיבי // חיצוניים).
 */

/** נתיב פנימי לאפליקציה בלבד — חייב להתחיל ב־/ אחד, לא // */
export function sanitizeInternalAppHref(
  href: string | null | undefined
): string | null {
  if (href == null) return null;
  const t = href.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return null;
  }
  if (!t.startsWith("/")) return null;
  if (t.startsWith("//") || t.startsWith("/\\")) return null;
  if (t.includes("\\")) return null;
  try {
    const u = new URL(t, "https://internal.invalid");
    const out = u.pathname + u.search + u.hash;
    if (!out.startsWith("/")) return null;
    return out;
  } catch {
    return null;
  }
}

/** קישור חיצוני — רק http/https */
export function sanitizeHttpUrlForHref(url: string): string | null {
  const t = url.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    return u.href;
  } catch {
    return null;
  }
}
