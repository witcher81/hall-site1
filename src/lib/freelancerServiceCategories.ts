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
      "קייטרינג כשר למהדרין",
      "קייטרינג ללא גלוטן",
      "שף פרטי לאירוע",
      "שף על האש",
      "בר משקאות ואלכוהול",
      "בר קוקטיילים",
      "בר יין",
      "סומלייה",
      "בר קפה",
      "בר אקטיבי",
      "מזנונים ודוכני אוכל",
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
      "מתכנן/ת חתונה",
      "מפיק/ת אירועים",
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
      "צילום סטילס ווידאו",
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
      "תזמורת קלאסית",
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
      "תכשיטים לאירוע — השכרה",
      "נעליים ואביזרים לכלה",
      "השכרת אקססוריז (עגילים, זרים)",
    ],
  },
  {
    primary: "הזמנות ודפוס",
    services: [
      "הזמנות מודפסות",
      "הזמנות דיגיטליות",
      "Save the date",
      "סידורי שולחן ומספרי שולחן",
      "תפריטים וכרטיסי שם",
      "קליגרפיה",
      "עיצוב גרפי להזמנות",
      "מיתוג מלא לזוג (לוגו אירוע)",
      "שלטי שולחן ותגיות מתנות",
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
      "עשן צבעוני",
      "מכונת עשן",
      "מתנפחים ומשחקים",
      "דמויות ובובות",
      "סדנאות יצירה לאורחים",
      "משחקי קהל",
      "הגרלות ומתנות לאורחים",
      "מראת אינפיניטי",
      "קיר משקפיים",
      "בר עששיות",
      "מופע טישייט",
    ],
  },
  {
    primary: "ציוד ולוגיסטיקה",
    services: [
      "השכרת ציוד כללי לאירועים",
      "השכרת ריהוט (שולחנות, כיסאות)",
      "השכרת כלים, זכוכית וציוד הגשה",
      "הגברה ותאורה",
      "מסכי LED והקרנה",
      "במות ותפאורה טכנית",
      "גנרטורים וחשמל זמני",
      "אוהלים והצללות",
      "שירותים ניידים",
      "גידור ובקרת קהל",
      "באקדרופים לצילום",
      "טראס ומנוף תאורה",
      "מצלמות אבטחה",
      "מיזוג אוויר לאירוע",
    ],
  },
  {
    primary: "שירותי קהל ותפעול",
    services: [
      "אבטחה וסדרנות",
      "דיילות וקבלת פנים",
      "מלצרים",
      "ברמנים",
      "שירותי חניה (Valet)",
      "הסעות אורחים",
      "השכרת לימוזינה",
      "אוטובוסים ומיניבוסים לאורחים",
      "ניקיון לפני/במהלך/אחרי",
      "חובש/פראמדיק לאירוע",
      "משגיח כשרות לאירוע",
      "מתנות לאורחים (Party favors)",
      "צוות הקמה ופירוק",
    ],
  },
  {
    primary: "אירועים עסקיים וכנסים",
    services: [
      "ניהול במת כנס",
      "ניהול תוכן ודוברים",
      "רישום דיגיטלי וצ׳ק-אין",
      "שידור היברידי",
      "צילום כנסים ותוכן שיווקי",
      "עמדות מיתוג וספונסרים",
      "תרגום סימולטני",
      "שירותי תמלול ונגישות",
      "הפקת וובינר",
      "הפקת ימי עיון",
      "עיצוב ומיתוג כנס",
      "מתנות לעובדים",
      "קיטים לעובדים",
    ],
  },
  {
    primary: "מיתוג חווייתי ואקטיבציות",
    services: [
      "אקטיבציות מותג",
      "אירועי פופ-אפ",
      "עמדות חוויה אינטראקטיביות",
      "עמדות VR",
      "עמדות AR",
      "דוכני תערוכה",
      "משחקים תחרותיים לקהל",
      "מתנות ומזכרות ממותגות",
      "ניהול תוכן לרשתות בזמן אמת",
      "סקר קהל והצבעה חיה",
      "עמדות מיצגים אינטראקטיביים",
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
  "שירותי קהל ותפעול":
    "צוותים שמקבלים את האורחים ודואגים שהכול יתנהל בנעימים ובבטחה.",
  "אירועים עסקיים וכנסים":
    "ניהול הפקה, תוכן ושידור לכנסים, ימי עיון ואירועי חברה.",
  "מיתוג חווייתי ואקטיבציות":
    "חוויות מותג, אקטיבציות ומופעי קהל שמשאירים רושם.",
  אחר: "שירות מותאם אישית שלא נכנס בקטגוריות האחרות.",
};

export function getPrimaryCategoryDescription(primary: string): string | null {
  const key = primary.trim();
  if (!key) return null;
  return FREELANCER_PRIMARY_CATEGORY_DESCRIPTIONS[key] ?? null;
}
