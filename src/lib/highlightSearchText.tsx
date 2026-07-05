import type { ReactNode } from "react";

/** מוצא את כל המופעים של מחרוזת החיפוש (לא רגיש לרישיות) */
function findMatchIndices(text: string, query: string): number[] {
  const q = query.trim();
  if (!q) return [];
  const indices: number[] = [];
  const lowerText = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  let from = 0;
  while (from < text.length) {
    const idx = lowerText.indexOf(lowerQ, from);
    if (idx === -1) break;
    indices.push(idx);
    from = idx + Math.max(1, q.length);
  }
  return indices;
}

/** מדגיש מילת מפתח בתוך טקסט — לחיפוש קטגוריות וכד׳ */
export function highlightSearchText(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;

  const indices = findMatchIndices(text, q);
  if (indices.length === 0) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;
  indices.forEach((start, i) => {
    const end = start + q.length;
    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }
    parts.push(
      <mark
        key={`${start}-${i}`}
        className="search-text-highlight rounded-sm bg-amber-300/85 px-0.5 font-semibold text-emerald-950 not-italic"
      >
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  });
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return parts;
}

export function textMatchesSearch(text: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  return (
    text.toLowerCase().includes(q.toLowerCase()) || text.includes(q)
  );
}
