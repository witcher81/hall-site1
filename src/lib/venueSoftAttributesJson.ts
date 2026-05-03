import { USER_INPUT_MAX } from "@/lib/userInputValidation";

export type VenueSoftAttributeRow = {
  id: string;
  label: string;
  /** מוצג כמאפיין פעיל (חיפוש / עמוד אולם) */
  on: boolean;
};

const MAX_ROWS = 25;
const MAX_LABEL = 80;

export function newVenueSoftAttributeRow(label: string): VenueSoftAttributeRow {
  const id =
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `sa-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return { id, label: label.trim(), on: true };
}

/** פרסור בטוח לשרת — מחזיר JSON תקין או שגיאה */
export function parseVenueSoftAttributesJson(
  raw: string | null | undefined
): { json: string | null; error: string | null } {
  if (raw == null || typeof raw !== "string" || raw.trim() === "") {
    return { json: null, error: null };
  }
  if (raw.length > USER_INPUT_MAX.JSON_FORM_FIELD) {
    return { json: null, error: "נתוני מאפיינים מותאמים ארוכים מדי." };
  }
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return { json: null, error: "פורמט מאפיינים מותאמים לא תקין." };
    const rows: VenueSoftAttributeRow[] = [];
    const seen = new Set<string>();
    for (const item of v) {
      if (rows.length >= MAX_ROWS) break;
      if (typeof item !== "object" || item === null) continue;
      const o = item as Record<string, unknown>;
      const id =
        typeof o.id === "string" && o.id.trim().length > 0 ? o.id.trim().slice(0, 64) : "";
      const label = typeof o.label === "string" ? o.label.trim() : "";
      if (!label || label.length > MAX_LABEL) continue;
      const dedupe = label.toLowerCase();
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      const on = o.on === true || o.on === "true";
      rows.push({
        id: id || `sa-${rows.length}-${dedupe.slice(0, 20)}`,
        label,
        on,
      });
    }
    return { json: rows.length > 0 ? JSON.stringify(rows) : null, error: null };
  } catch {
    return { json: null, error: "פורמט מאפיינים מותאמים לא תקין." };
  }
}

export function parseVenueSoftAttributesFromDb(
  raw: string | null | undefined
): VenueSoftAttributeRow[] {
  const r = parseVenueSoftAttributesJson(raw ?? null);
  if (r.error || !r.json) return [];
  try {
    const v = JSON.parse(r.json) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(
      (x): x is VenueSoftAttributeRow =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as VenueSoftAttributeRow).label === "string" &&
        typeof (x as VenueSoftAttributeRow).id === "string"
    ) as VenueSoftAttributeRow[];
  } catch {
    return [];
  }
}
