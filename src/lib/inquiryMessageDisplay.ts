/** טקסט ברירת מחדל כשאין הערות חופשיות — מוצג רק אם אין בלוק שירותים מובנה */
export const DEFAULT_INQUIRY_SEEKER_MESSAGE =
  "פנייה מהאתר — אשמח לבדיקת זמינות והצעת מחיר.";

/** ברירת מחדל לבקשות שירות לספקים דרך הזמנת אולם */
export const DEFAULT_INQUIRY_SUPPLIER_MESSAGE =
  "פנייה דרך הזמנת אולם — אשמח לפרטים והצעת מחיר.";

/** תאריך יעד לתצוגה (ממחרוזת YYYY-MM-DD) */
export function formatInquiryPreferredDateForDisplay(
  ymd: string | null | undefined
): string | null {
  if (!ymd || ymd.length !== 10) return null;
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** מסיר את בלוק "בחירות שירותים" מהודעה ישנה (לפני שהופרד ל־JSON) */
export function stripEmbeddedServiceChoicesFromInquiryMessage(message: string): string {
  const trimmed = message.trim();
  const marker = "\n\nבחירות שירותים:";
  const idx = trimmed.indexOf(marker);
  if (idx !== -1) return trimmed.slice(0, idx).trim();
  return trimmed;
}

/** האם להציג את טקסט ההערות — מסתירים ברירת מחדל כשיש רשימת שירותים (נשארים פרטי האירוע למעלה) */
export function shouldShowInquiryFreeText(
  message: string,
  hasStructuredServiceChoices: boolean
): boolean {
  const t = stripEmbeddedServiceChoicesFromInquiryMessage(message);
  if (!t) return false;
  if (
    hasStructuredServiceChoices &&
    t.trim() === DEFAULT_INQUIRY_SEEKER_MESSAGE
  ) {
    return false;
  }
  return true;
}

/**
 * פורמט ישן של הודעה: אותו תוכן כמו בפרטי האירוע למעלה — לא מציגים שוב כדי לחסוך כפילות.
 */
export function isRedundantLegacyBoilerplate(
  message: string,
  preferredDate: string | null,
  guestCount: number | null
): boolean {
  const t = stripEmbeddedServiceChoicesFromInquiryMessage(message).trim();
  const re =
    /^פנייה מהאתר — תאריך מבוקש: (\d{4}-\d{2}-\d{2}), כ[־\-]\s*(\d+) אורחים\. אשמח לבדיקת זמינות והצעת מחיר\.?$/;
  const m = t.match(re);
  if (!m) return false;
  const ymd = m[1];
  const guests = Number(m[2]);
  if (!Number.isFinite(guests)) return false;
  if (preferredDate !== ymd) return false;
  if (guestCount == null || !Number.isFinite(guestCount)) return false;
  return Math.round(guestCount) === guests;
}
