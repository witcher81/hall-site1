/** סוגי כשרות נפוצים באולמות אירועים בישראל (רבנות, מהדרין, בד״ץ) */
export const VENUE_KASHRUT_OPTIONS = [
  { value: "ללא", label: "ללא כשרות" },
  { value: "רגיל", label: "רבנות רגילה" },
  { value: "מהדרין", label: "רבנות מהדרין" },
  { value: "בד״ץ העדה החרדית", label: "בד״ץ העדה החרדית" },
  { value: "בד״ץ בית יוסף", label: "בד״ץ בית יוסף" },
  { value: "בד״ץ חתם סופר", label: "בד״ץ חתם סופר" },
  { value: "בד״ץ שארית ישראל", label: "בד״ץ שארית ישראל" },
  { value: "בד״ץ הרב לנדא", label: "בד״ץ הרב לנדא" },
  { value: "בד״ץ הרב מחפוד", label: "בד״ץ הרב מחפוד" },
] as const;

export type VenueKashrutOptionValue = (typeof VENUE_KASHRUT_OPTIONS)[number]["value"];

const KNOWN_VALUES = new Set<string>(
  VENUE_KASHRUT_OPTIONS.map((o) => o.value)
);

export function venueKashrutLabel(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  const hit = VENUE_KASHRUT_OPTIONS.find((o) => o.value === v);
  return hit?.label ?? v;
}

export function isKnownVenueKashrut(value: string): boolean {
  return KNOWN_VALUES.has(value.trim());
}

export function validateVenueKashrut(
  raw: unknown
): { ok: true; value: string | null } | { ok: false; error: string } {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return { ok: true, value: null };
  if (!isKnownVenueKashrut(s)) {
    return { ok: false, error: "סוג כשרות לא תקין — בחרו מהרשימה." };
  }
  return { ok: true, value: s };
}

/** מיפוי חיפוש טבעי → ערך סינון */
export function parseKashrutHintFromText(normalized: string): string | undefined {
  if (/(ללא כשרות|לא כשר)/.test(normalized)) return "ללא";
  if (/(עדה החרדית|בד.?ץ.?העדה|בדץ העדה)/.test(normalized)) {
    return "בד״ץ העדה החרדית";
  }
  if (/(בית יוסף|בד.?ץ.?בית)/.test(normalized)) return "בד״ץ בית יוסף";
  if (/(חתם סופר|בד.?ץ.?חתם)/.test(normalized)) return "בד״ץ חתם סופר";
  if (/(שארית ישראל|בד.?ץ.?שארית)/.test(normalized)) return "בד״ץ שארית ישראל";
  if (/(הרב לנדא|לנדא|בד.?ץ.?לנדא)/.test(normalized)) return "בד״ץ הרב לנדא";
  if (/(מחפוד|בד.?ץ.?מחפוד)/.test(normalized)) return "בד״ץ הרב מחפוד";
  if (/(מהדרין|מהודר)/.test(normalized)) return "מהדרין";
  if (/(בד.?ץ|badatz)/i.test(normalized)) return "מהדרין";
  if (/(כשר|רבנות)/.test(normalized)) return "רגיל";
  return undefined;
}
