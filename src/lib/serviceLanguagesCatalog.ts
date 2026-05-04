/** ליישור עם USER_INPUT_MAX.LANGUAGES_LINE ב־userInputValidation */
export const SERVICE_LANGUAGES_MAX_CHARS = 300;

/** שפות נפוצות לבחירה מהירה (ישראל / סביבה) — ניתן גם להוסיף שפה חופשית */
export const SERVICE_WORK_LANGUAGES_PRESET_HE: readonly string[] = [
  "עברית",
  "אנגלית",
  "ערבית",
  "רוסית",
  "אמהרית",
  "צרפתית",
  "ספרדית",
  "איטלקית",
  "גרמנית",
  "יידיש",
  "רומנית",
  "פולנית",
  "אוקראינית",
  "טורקית",
  "פרסית",
  "כורדית",
  "הונגרית",
  "פורטוגזית",
  "הינדי",
  "אורדו",
  "סינית (מנדרינית)",
  "יפנית",
  "קוריאנית",
  "תאית",
  "וייטנאמית",
  "יוונית",
  "הולנדית",
  "שוודית",
  "נורווגית",
  "דנית",
  "פינית",
  "צ׳כית",
  "סלובקית",
  "בולגרית",
  "סרבית",
  "קרואטית",
  "בוסנית",
  "אלבנית",
  "מקדונית",
  "גאורגית",
  "ארמנית",
  "טג׳יקית",
  "אוזבקית",
  "לטבית",
  "ליטאית",
  "אסטונית",
  "אידו",
  "סלובנית",
];

export function parseServiceLanguagesToTags(line: string): string[] {
  const parts = line.split(/[,;،]/).map((p) => p.trim()).filter(Boolean);
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

export function serializeServiceLanguagesTags(tags: string[]): string {
  return tags.map((t) => t.trim()).filter(Boolean).join(", ");
}
