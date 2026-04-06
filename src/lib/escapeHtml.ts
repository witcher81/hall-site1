/**
 * בריחת תווים ל-HTML כשבונים מחרוזת HTML ידנית.
 * ברירת המחדל ב-React: תוכן משתמש כילדים טקסט — {value} — מוברח אוטומטית (אין הרצת &lt;script&gt;).
 * אל תשתמש ב-dangerouslySetInnerHTML עם קלט משתמש בלי סניטציה מוכחת.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
