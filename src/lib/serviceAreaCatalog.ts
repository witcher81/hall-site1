/** ליישור עם USER_INPUT_MAX.SERVICE_AREA_TEXT ב־userInputValidation */
export const SERVICE_AREA_MAX_CHARS = 200;

export const SERVICE_AREA_PRESET_HE: readonly string[] = [
  "כל הארץ",
  "מרכז",
  "צפון",
  "דרום",
  "ירושלים והסביבה",
  "שפלה",
  "שרון",
  "גוש דן",
  "חיפה והקריות",
  "אזור תל אביב",
  "אזור ירושלים",
  "אזור באר שבע",
  "אזור אשדוד ואשקלון",
  "אזור נתניה וחדרה",
  "אזור מודיעין",
];

export function parseServiceAreasToTags(line: string): string[] {
  const parts = line
    .split(/[,;،/]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

export function serializeServiceAreaTags(tags: string[]): string {
  return tags.map((t) => t.trim()).filter(Boolean).join(", ");
}

