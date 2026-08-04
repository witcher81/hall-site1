import { resolveSecondaryServiceDescription } from "@/lib/freelancerServiceDescriptions";

export const CATEGORY_VALUE_SEPARATOR = " / ";
/** מפריד בין מספר תת־קטגוריות תחת אותה קטגוריה ראשית */
export const CATEGORY_MULTI_SEPARATOR = " · ";

/** קטגוריה ראשית לשירותי אוכל — מפעילה עורך תפריט */
export const FOOD_BEVERAGE_PRIMARY = "אוכל ומשקאות";

/**
 * קטגוריות שירות לפרילנסרים — מבוסס על אינדקסי ספקים לאירועים בישראל
 * (מיט פור מיט, סוגרים חתונה, Engaged, IEM) + רשימות ספקים בינלאומיות.
 * אולמות/גנים נמצאים בחיפוש אולמות — לא כאן.
 */
export const FREELANCER_CATEGORY_GROUPS = [
  {
    primary: FOOD_BEVERAGE_PRIMARY,
    services: [
      "קייטרינג חלבי",
      "קייטרינג בשרי",
      "קייטרינג צמחוני",
      "קייטרינג טבעוני",
      "שף פרטי לאירוע",
      "שף על האש",
      "סדנאות אוכל",
      "בר משקאות ואלכוהול",
      "בר קוקטיילים",
      "בר יין",
      "סומלייה",
      "בר קפה",
      "בר אקטיבי",
      "מזנונים ודוכני אוכל",
      "שולחן שוק",
      "קינוחים ושולחנות מתוקים",
      "עוגות לאירועים",
      "בר מתוקים",
      "עמדת גלידה",
      "עמדת וופל בלגי",
      "עמדת קרפים",
      "עמדת פופקורן",
      "עמדת סושי",
    ],
  },
  {
    primary: "תכנון וניהול אירוע",
    services: [
      "הפקת אירועים פרטיים",
      "הצעות נישואין",
      "הפקת אירועי חברה/כנסים",
      "מתאם/ת יום האירוע",
      "שירות אישורי הגעה והושבה",
      "רישום וצ׳ק-אין אורחים בכניסה",
    ],
  },
  {
    primary: "צילום ותיעוד",
    services: [
      "צילום סטילס לאירוע",
      "צילום וידאו לאירוע",
      "צילום טרום-חתונה",
      "צלם מגנטים",
      "עמדת צילום לאורחים",
      "מראת סלפי",
      "צילום רחפן",
      "קליפ בערב החתונה",
    ],
  },
  {
    primary: "מוזיקה ובמה",
    services: [
      "DJ ותקליטנים",
      "MC — מנחה אירוע",
      "זמר/ת לאירוע",
      "להקה לאירוע",
      "זמר חופה / טקס",
      "נגן אירוע",
      "נגנים לאירוע",
      "מופעי ריקוד ובמה",
      "הנחיה וקריינות",
    ],
  },
  {
    primary: "טקסים",
    services: [
      "רב לטקס",
      "עורך טקס",
      "מוהל",
      "עורך דין לטקס חילוני",
      "מדריך בר/בת מצווה בכותל",
      "הפרחת יונים או פרפרים",
    ],
  },
  {
    primary: "עיצוב ומיתוג",
    services: [
      "עיצוב אירועים",
      "סטיילינג וקונספט לאירוע",
      "סידור פרחים לאירוע",
      "סידור בלונים לאירוע",
      "סידור שולחנות לאירוע",
      "תאורה דקורטיבית לאירוע",
    ],
  },
  {
    primary: "יופי ואיפור",
    services: [
      "איפור כלה",
      "עיצוב שיער לכלה",
      "איפור לאורחות",
      "מניקור / פדיקור לאירוע",
      "טיפוח חתן",
      "איפור אומנותי",
      "שיזוף לאירוע",
      "סטיילינג אישי",
    ],
  },
  {
    primary: "הלבשה ואופנה לאירוע",
    services: [
      "שמלות כלה — השכרה",
      "שמלות כלה — תפירה והתאמות",
      "שמלת ערב",
      "שמלה שנייה לריקודים",
      "חליפות חתן — השכרה",
      "חליפות חתן — תפור",
      "סטיילינג והנחיית לוק לזוג",
      "תכשיטים, נעליים ואקסוריז לכלה",
    ],
  },
  {
    primary: "הזמנות ודפוס",
    services: [
      "הזמנות מודפסות",
      "הזמנות דיגיטליות",
      "Save the date",
      "קליגרפיה",
      "עיצוב גרפי להזמנות",
    ],
  },
  {
    primary: "אטרקציות ובידור",
    services: [
      "קוסם",
      "ציור חי באירוע",
      "אמן חושים",
      "ליצנים והפעלות ילדים",
      "קריקטוריסט",
      "צייר לאורחים",
      "ציורי פנים ואיפור",
      "עמדות צילום אינטראקטיביות",
      "זיקוקים ואפקטים",
      "מופע אש ופירוטכניקה",
      "מתנפחים ומשחקים",
      "דמויות ובובות",
      "סדנאות יצירה לאורחים",
      "משחקי קהל",
      "מופע טישייט",
      "עמדות VR ו-AR",
      "עמדות חוויה אינטראקטיביות",
    ],
  },
  {
    primary: "ציוד ולוגיסטיקה",
    services: [
      "השכרת ציוד כללי לאירועים",
      "השכרת ריהוט (שולחנות, כיסאות)",
      "השכרת כלים וציוד הגשה",
      "הגברה לאירועים (סאונדמן)",
      "תאורה לאירועים (לייטמן)",
      "מסכי LED והקרנה",
      "במות ותפאורה טכנית",
      "גנרטורים וחשמל זמני",
      "אוהלים והצללות",
      "שירותים ניידים",
      "גידור ובקרת קהל",
      "באקדרופים לצילום",
      "טראס ומנוף תאורה",
      "מיזוג אוויר לאירוע",
    ],
  },
  {
    primary: "צוותים ותפעול לאירוע",
    services: [
      "אבטחה וסדרנות",
      "צוות קבלת פנים",
      "מלצרים",
      "ברמנים",
      "שירותי חניה (Valet)",
      "הסעות אורחים",
      "השכרת לימוזינה",
      "אוטובוסים ומיניבוסים לאורחים",
      "ניקיון לפני/במהלך/אחרי",
      "חובש/פראמדיק לאירוע",
      "משגיח כשרות לאירוע",
      "צוות הקמה ופירוק",
    ],
  },
  {
    primary: "אירועים עסקיים וכנסים",
    services: [
      "שידור היברידי",
      "צילום כנסים ותוכן שיווקי",
      "תרגום סימולטני",
      "שירותי תמלול ונגישות",
      "הפקה, עיצוב ומיתוג לכנסים ווובינרים",
    ],
  },
  {
    primary: "אחר",
    services: ["שירות אחר"],
  },
] as const;

export const FREELANCER_PRIMARY_CATEGORIES = FREELANCER_CATEGORY_GROUPS.map(
  (g) => g.primary
);

/** תאימות לאזורים ישנים בקוד */
export const FREELANCER_SERVICE_CATEGORIES = FREELANCER_PRIMARY_CATEGORIES;

export function getSecondaryServicesForPrimary(primary: string): string[] {
  const group = FREELANCER_CATEGORY_GROUPS.find((g) => g.primary === primary);
  return group ? [...group.services] : [];
}

export function getSecondaryServiceDescription(
  service: string,
  primary = ""
): string {
  return resolveSecondaryServiceDescription(service, primary);
}

export function composeServiceCategoryValue(
  primary: string,
  secondary: string | string[]
): string {
  const p = primary.trim();
  if (!p) return "";
  const list = Array.isArray(secondary) ? secondary : [secondary];
  const cleaned = list.map((s) => s.trim()).filter(Boolean);
  if (cleaned.length === 0) return p;
  return `${p}${CATEGORY_VALUE_SEPARATOR}${cleaned.join(CATEGORY_MULTI_SEPARATOR)}`;
}

export function parseServiceCategorySelections(raw: string): {
  primary: string;
  secondaries: string[];
} {
  const val = (raw ?? "").trim();
  if (!val) return { primary: "", secondaries: [] };
  if (!val.includes(CATEGORY_VALUE_SEPARATOR)) {
    return { primary: val, secondaries: [] };
  }
  const [p, rest] = val.split(CATEGORY_VALUE_SEPARATOR, 2);
  const primary = (p ?? "").trim();
  const secondaryPart = (rest ?? "").trim();
  if (!secondaryPart) return { primary, secondaries: [] };
  const secondaries = secondaryPart
    .split(CATEGORY_MULTI_SEPARATOR)
    .map((s) => s.trim())
    .filter(Boolean);
  return { primary, secondaries };
}

export function formatServiceCategoryDisplay(raw: string): string {
  const { primary, secondaries } = parseServiceCategorySelections(raw);
  if (!primary) return "בחר קטגוריה";
  if (secondaries.length === 0) return primary;
  return composeServiceCategoryValue(primary, secondaries);
}

export function parseServiceCategoryValue(raw: string): {
  primary: string;
  secondary: string;
} {
  const { primary, secondaries } = parseServiceCategorySelections(raw);
  return {
    primary,
    secondary: secondaries.join(CATEGORY_MULTI_SEPARATOR),
  };
}

/** תיאור קצר לכל קטגוריה ראשית — לתצוגה בעמודי שירות */
const FREELANCER_PRIMARY_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "אוכל ומשקאות":
    "כל מה שקשור לאוכל ושתייה באירוע — מהמטבח, ברים ועמדות מזון.",
  "תכנון וניהול אירוע":
    "תכנון, הפקה וליווי אירועים — מהחזון ועד יום האירוע.",
  "צילום ותיעוד":
    "צילום סטילס, וידאו ותיעוד יצירתי שמשאירים את האירוע לזיכרון.",
  "מוזיקה ובמה":
    "מוזיקה חיה, די־ג׳יי והנחיה — האווירה והמוזיקה של האירוע.",
  טקסים:
    "מי שמוביל או מלווה טקס — חופה, ברית, בר/בת מצווה וסמלים טקסיים.",
  "עיצוב ומיתוג":
    "עיצוב המרחב, הפרחים, השולחנות והאווירה של האירוע.",
  "יופי ואיפור":
    "איפור, שיער וטיפוח לכלה, לחתן ולאורחים — ליום המלא או לחינה.",
  "הלבשה ואופנה לאירוע":
    "שמלות, חליפות, התאמות והשכרות — לוק מושלם ליום המיוחד.",
  "הזמנות ודפוס":
    "הזמנות, סידורי שולחן ועיצוב גרפי — הרושם הראשון של האורחים.",
  "אטרקציות ובידור":
    "הפעלות, אמני במה ומופעים שמרימים את הקהל ויוצרים חוויה זכירה.",
  "ציוד ולוגיסטיקה":
    "תשתיות טכניות לאירוע — הגברה, תאורה, השכרות והקמה.",
  "צוותים ותפעול לאירוע":
    "צוותי קבלה, שירות, בטיחות והקמה שעוזרים לאירוע לרוץ בצורה מסודרת.",
  "אירועים עסקיים וכנסים":
    "שידור, צילום, תרגום ותמלול לכנסים — שירותים טכניים ומקצועיים לאירועי חברה.",
  אחר: "שירות מותאם אישית שלא נכנס בקטגוריות האחרות.",
};

export function getPrimaryCategoryDescription(primary: string): string | null {
  const key = primary.trim();
  if (!key) return null;
  return FREELANCER_PRIMARY_CATEGORY_DESCRIPTIONS[key] ?? null;
}
