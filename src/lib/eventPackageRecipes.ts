/**
 * מתכוני חבילה לפי סוג אירוע —
 * האתר מרכיב אולם + ספקים רלוונטיים (לא הלקוח ידנית).
 */

export type PackageSlotKind = "venue" | "service";

export type PackageServiceSlot = {
  kind: "service";
  /** מפתח פנימי */
  key: string;
  /** תווית בעברית בכרטיס */
  label: string;
  /** קטגוריה ראשית במאגר */
  category: string;
  /** משני מועדף (אופציונלי) */
  secondary?: string;
  /** חלופות משני אם אין התאמה מדויקת */
  secondaryFallbacks?: string[];
  required?: boolean;
};

export type PackageVenueSlot = {
  kind: "venue";
  key: "venue";
  label: string;
  required?: boolean;
};

export type PackageSlot = PackageVenueSlot | PackageServiceSlot;

export type EventPackageRecipe = {
  eventType: string;
  headline: string;
  blurb: string;
  slots: PackageSlot[];
};

const DJ: PackageServiceSlot = {
  kind: "service",
  key: "dj",
  label: "DJ / מוזיקה",
  category: "מוזיקה ובמה",
  secondary: "DJ ותקליטנים",
  required: true,
};

const PHOTO: PackageServiceSlot = {
  kind: "service",
  key: "photo",
  label: "צילום",
  category: "צילום ותיעוד",
  required: true,
};

const CATERING: PackageServiceSlot = {
  kind: "service",
  key: "catering",
  label: "אוכל / קייטרינג",
  category: "אוכל ומשקאות",
  required: true,
};

const BAR: PackageServiceSlot = {
  kind: "service",
  key: "bar",
  label: "בר ומשקאות",
  category: "צוותים ותפעול לאירוע",
  secondary: "ברמנים",
  required: false,
};

const DESIGN: PackageServiceSlot = {
  kind: "service",
  key: "design",
  label: "עיצוב",
  category: "עיצוב ומיתוג",
  required: false,
};

const KIDS_HOST: PackageServiceSlot = {
  kind: "service",
  key: "kids_host",
  label: "מפעיל / הפעלות",
  category: "אטרקציות ובידור",
  secondary: "ליצנים והפעלות ילדים",
  secondaryFallbacks: ["מתנפחים ומשחקים", "דמויות ובובות", "משחקי קהל"],
  required: true,
};

const ATTRACTION: PackageServiceSlot = {
  kind: "service",
  key: "attraction",
  label: "אטרקציה / בידור",
  category: "אטרקציות ובידור",
  required: false,
};

const VENUE: PackageVenueSlot = {
  kind: "venue",
  key: "venue",
  label: "אולם",
  required: true,
};

const RECIPES: Record<string, EventPackageRecipe> = {
  "יום הולדת": {
    eventType: "יום הולדת",
    headline: "חבילת יום הולדת",
    blurb: "אולם שמתאים למסיבה + מפעיל ואווירה.",
    slots: [VENUE, KIDS_HOST, CATERING, PHOTO],
  },
  "בר מצווה / בת מצווה": {
    eventType: "בר מצווה / בת מצווה",
    headline: "חבילת בר / בת מצווה",
    blurb: "אולם, מוזיקה, צילום ואוכל — הכל במקום אחד.",
    slots: [VENUE, DJ, PHOTO, CATERING],
  },
  "ברית / בריתה": {
    eventType: "ברית / בריתה",
    headline: "חבילת ברית / בריתה",
    blurb: "אולם Intimate יחסית, אוכל וצילום.",
    slots: [VENUE, CATERING, PHOTO],
  },
  חינה: {
    eventType: "חינה",
    headline: "חבילת חינה",
    blurb: "אולם/גן, עיצוב, מוזיקה וצילום.",
    slots: [VENUE, DESIGN, DJ, PHOTO],
  },
  "מסיבת רווקים / רווקות": {
    eventType: "מסיבת רווקים / רווקות",
    headline: "חבילת מסיבת רווקים / רווקות",
    blurb: "אולם למסיבה, DJ, בר ואטרקציה.",
    slots: [VENUE, DJ, BAR, ATTRACTION],
  },
  חתונה: {
    eventType: "חתונה",
    headline: "חבילת חתונה",
    blurb: "אולם, DJ, צילום וקייטרינג — בסיס חזק לחתונה.",
    slots: [VENUE, DJ, PHOTO, CATERING, DESIGN],
  },
  "אירוע עסקי": {
    eventType: "אירוע עסקי",
    headline: "חבילת אירוע עסקי",
    blurb: "אולם, הגברה/במה וקייטרינג קל.",
    slots: [
      VENUE,
      {
        kind: "service",
        key: "av",
        label: "הגברה / במה",
        category: "ציוד ולוגיסטיקה",
        secondary: "הגברה לאירועים (סאונדמן)",
        secondaryFallbacks: ["תאורה לאירועים (לייטמן)", "מסכי LED והקרנה"],
        required: false,
      },
      CATERING,
    ],
  },
  כנס: {
    eventType: "כנס",
    headline: "חבילת כנס",
    blurb: "אולם, ציוד טכני וכיבוד.",
    slots: [
      VENUE,
      {
        kind: "service",
        key: "av",
        label: "ציוד טכני",
        category: "ציוד ולוגיסטיקה",
        required: true,
      },
      CATERING,
    ],
  },
};

const FALLBACK_RECIPE: EventPackageRecipe = {
  eventType: "אירוע אחר",
  headline: "חבילת אירוע",
  blurb: "אולם + ספקים בסיסיים לפי מה שזמין באזור.",
  slots: [VENUE, DJ, CATERING, PHOTO],
};

export function getEventPackageRecipe(eventType: string): EventPackageRecipe {
  const key = eventType.trim();
  return RECIPES[key] ?? FALLBACK_RECIPE;
}

export function listRecipeEventTypes(): string[] {
  return Object.keys(RECIPES);
}
