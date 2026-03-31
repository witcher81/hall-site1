export type ServiceCustomInclude = { label: string; checked: boolean };

const MAX_ITEMS = 20;
const MAX_LABEL_LEN = 80;

export function parseCustomIncludesJson(
  json: string | null | undefined
): ServiceCustomInclude[] {
  if (!json) return [];
  try {
    const data = JSON.parse(json) as unknown;
    return sanitizeCustomIncludesFromClient(data);
  } catch {
    return [];
  }
}

export function sanitizeCustomIncludesFromClient(
  data: unknown
): ServiceCustomInclude[] {
  if (!Array.isArray(data)) return [];
  const out: ServiceCustomInclude[] = [];
  for (const item of data) {
    if (out.length >= MAX_ITEMS) break;
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label =
      typeof o.label === "string"
        ? o.label.trim().slice(0, MAX_LABEL_LEN)
        : "";
    if (!label) continue;
    const checked = typeof o.checked === "boolean" ? o.checked : true;
    out.push({ label, checked });
  }
  return out;
}

/** מחזיר JSON לשמירה ב-DB או null אם ריק */
export function serializeCustomIncludesJson(
  items: ServiceCustomInclude[]
): string | null {
  const sanitized = sanitizeCustomIncludesFromClient(items);
  if (sanitized.length === 0) return null;
  return JSON.stringify(sanitized);
}

const MAX_INCLUDES_NOTE_LEN = 500;

export function sanitizeIncludesNote(
  s: string | null | undefined
): string | null {
  if (s == null || typeof s !== "string") return null;
  const t = s.trim();
  if (!t) return null;
  return t.slice(0, MAX_INCLUDES_NOTE_LEN);
}

export function hasAnyServiceIncludes(
  includesEquipment: boolean,
  customIncludes: ServiceCustomInclude[],
  includesNote?: string | null
): boolean {
  return (
    includesEquipment ||
    customIncludes.some((c) => c.checked && c.label.trim().length > 0) ||
    sanitizeIncludesNote(includesNote) != null
  );
}
