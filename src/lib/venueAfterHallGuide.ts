/**
 * מדריך אחרי בחירת אולם: מיפוי תוספות באולם ↔ קטגוריות ספקים, והצעות השלמה לפי סוג אירוע.
 */

export type HallMoneyBuiltinKey =
  | "hasFood"
  | "hasDanceFloor"
  | "hasTableSetup"
  | "hasSoundSystem";

export const HALL_BUILTIN_LABELS: Record<HallMoneyBuiltinKey, string> = {
  hasFood: "אוכל באולם",
  hasDanceFloor: "רחבת ריקודים",
  hasTableSetup: "סידור שולחנות",
  hasSoundSystem: "מערכת הגברה",
};

/** קטגוריית שירות במאגר הספקים (תואם ל־ProvidersSearchClient) */
export function providerCategoryForHallBuiltin(
  key: HallMoneyBuiltinKey
): string | null {
  switch (key) {
    case "hasFood":
      return "קייטרינג";
    case "hasDanceFloor":
    case "hasSoundSystem":
      return "DJ";
    case "hasTableSetup":
      return "עיצוב אירועים";
    default:
      return null;
  }
}

/** ניסיון לנחש קטגוריה מתווית שורה מותאמת באולם */
export function providerCategoryForCustomLabel(label: string): string | null {
  const t = label.trim().toLowerCase();
  if (!t) return null;
  if (t.includes("פרח") || t.includes("זר")) return "פרחים";
  if (t.includes("dj") || t.includes("דיגיי")) return "DJ";
  if (t.includes("צילום") || t.includes("צלם")) return "צילום";
  if (t.includes("וידאו")) return "וידאו";
  if (t.includes("קייטר") || t.includes("אוכל") || t.includes("מנות")) return "קייטרינג";
  if (t.includes("עיצוב")) return "עיצוב אירועים";
  if (t.includes("הנחיה") || t.includes("מנחה")) return "הנחיה";
  if (t.includes("מוזיקה") && !t.includes("dj")) return "מוזיקה";
  return null;
}

export type GapSuggestion = {
  id: string;
  title: string;
  body: string;
  /** קטגוריה לחיפוש ב־/providers */
  category: string;
};

const WEDDING_GAPS: GapSuggestion[] = [
  {
    id: "dj",
    title: "DJ",
    body: "גם כשיש הגברה באולם — לעיתים רוצים DJ נפרד לחופה ולרחבה.",
    category: "DJ",
  },
  {
    id: "photo",
    title: "צילום ווידאו",
    body: "תיעוד מקצועי ליום שכזה — אפשר להשוות מחירים אצל ספקים.",
    category: "צילום",
  },
  {
    id: "flowers",
    title: "עיצוב ופרחים",
    body: "זרים, חופה מעוצבת, קישוטי שולחן — לעיתים זול יותר דרך ספק חיצוני.",
    category: "פרחים",
  },
];

const BIRTHDAY_GAPS: GapSuggestion[] = [
  {
    id: "food",
    title: "אוכל וקייטרינג",
    body: "אם האולם לא כולל מנות — אפשר להזמין קייטרינג נפרד.",
    category: "קייטרינג",
  },
  {
    id: "activity",
    title: "פעילות ואטרקציות",
    body: "סדנאות, משחקים, בלונים, מפעילים — לפי גיל האורחים.",
    category: "אחר",
  },
];

const BAR_BAT_GAPS: GapSuggestion[] = [
  {
    id: "dj",
    title: "DJ / מוזיקה",
    body: "מסיבה, ריקודים והפתעות — ספקי מוזיקה במאגר.",
    category: "DJ",
  },
  {
    id: "photo",
    title: "צילום",
    body: "תיעוד הטקס והמסיבה.",
    category: "צילום",
  },
  {
    id: "food",
    title: "קייטרינג",
    body: "ברים מתוקים, מנות, עמדות מזון.",
    category: "קייטרינג",
  },
];

export const AFTER_VENUE_EVENT_TYPE_OPTIONS = [
  "חתונה",
  "יום הולדת",
  "בר מצווה",
  "בת מצווה",
  "אחר",
] as const;

export type AfterVenueEventTypeOption = (typeof AFTER_VENUE_EVENT_TYPE_OPTIONS)[number];

export function gapSuggestionsForEventType(et: string): GapSuggestion[] {
  const t = et.trim();
  if (t === "חתונה") return WEDDING_GAPS;
  if (t === "יום הולדת") return BIRTHDAY_GAPS;
  if (t === "בר מצווה" || t === "בת מצווה") return BAR_BAT_GAPS;
  return [
    {
      id: "generic",
      title: "ספקים נוספים",
      body: "עיון במאגר לפי קטגוריה — צילום, DJ, קייטרינג ועוד.",
      category: "",
    },
  ];
}

export function providersHrefForCategory(category: string): string {
  const c = category.trim();
  if (!c) return "/providers";
  return `/providers?${new URLSearchParams({ category: c }).toString()}`;
}

/** תוצאת השוואת תוספת באולם מול מחיר מינימום במאגר (לדף אחרי אולם) */
export type SavingsOpportunityPayload = {
  id: string;
  hallLabel: string;
  hallPrice: number;
  category: string;
  marketFrom: number | null;
  cheaperThanHall: boolean;
};
