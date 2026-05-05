export const CATEGORY_VALUE_SEPARATOR = " / ";

export const FREELANCER_CATEGORY_GROUPS = [
  {
    primary: "אוכל ומשקאות",
    services: [
      "קייטרינג חלבי",
      "קייטרינג בשרי",
      "קייטרינג טבעוני/צמחוני",
      "בר משקאות ואלכוהול",
      "בר קפה",
      "מזנונים ודוכני אוכל",
      "קינוחים ושולחנות מתוקים",
      "עוגות לאירועים",
    ],
  },
  {
    primary: "תכנון וניהול אירוע",
    services: [
      "מפיק/ת אירועים",
      "מנהל/ת אירוע ביום האירוע",
      "ניהול לו״ז וספקים",
      "שירות אישורי הגעה והושבה",
      "ניהול רישום וצ׳ק-אין אורחים",
      "ניהול כנסים ואירועי חברה",
    ],
  },
  {
    primary: "צילום ותיעוד",
    services: [
      "צלם סטילס",
      "צלם וידאו",
      "צלם מגנטים",
      "תא צילום / פוטו-בוט",
      "שידור חי לאירוע",
      "עריכת וידאו וקליפים",
      "צילום רחפן",
    ],
  },
  {
    primary: "מוזיקה ובמה",
    services: [
      "DJ ותקליטנים",
      "זמרים ולהקות",
      "נגנים להרכבים וקבלת פנים",
      "מופעי ריקוד",
      "מופעי פרפורמנס",
      "הנחיה וקריינות",
    ],
  },
  {
    primary: "טקסים",
    services: ["רב/עורך טקס", "מוהל", "ניהול טקס במה/חופה"],
  },
  {
    primary: "עיצוב ומיתוג",
    services: [
      "עיצוב אירועים",
      "עיצוב פרחים",
      "עיצוב בלונים",
      "עיצוב חופה ותפאורה",
      "מיתוג ושילוט לאירוע",
      "עיצוב גרפי והדפסות",
    ],
  },
  {
    primary: "אטרקציות ובידור",
    services: [
      "קוסם/אמן חושים",
      "ליצנים והפעלות ילדים",
      "קריקטוריסט/צייר",
      "ציורי פנים ואיפור",
      "עמדות צילום אינטראקטיביות",
      "זיקוקים ואפקטים",
      "מתנפחים ומשחקים",
      "דמויות ובובות",
    ],
  },
  {
    primary: "ציוד ולוגיסטיקה",
    services: [
      "השכרת ציוד כללי לאירועים",
      "הגברה ותאורה",
      "מסכי LED והקרנה",
      "במות ותפאורה טכנית",
      "גנרטורים וחשמל זמני",
      "אוהלים והצללות",
      "שירותים ניידים",
      "גידור ובקרת קהל",
    ],
  },
  {
    primary: "שירותי קהל ותפעול",
    services: [
      "אבטחה וסדרנות",
      "דיילות וקבלת פנים",
      "שירותי חניה (Valet)",
      "הסעות אורחים",
      "ניקיון לפני/במהלך/אחרי",
      "חובש/פראמדיק לאירוע",
    ],
  },
  {
    primary: "אירועים עסקיים וכנסים",
    services: [
      "ניהול במת כנס",
      "ניהול תוכן ודוברים",
      "רישום דיגיטלי וצ׳ק-אין",
      "שידור היברידי / אונליין",
      "צילום כנסים ותוכן שיווקי",
      "עמדות מיתוג וספונסרים",
      "תרגום סימולטני",
      "שירותי תמלול ונגישות",
    ],
  },
  {
    primary: "מיתוג חווייתי ואקטיבציות",
    services: [
      "אקטיבציות מותג",
      "אירועי פופ-אפ",
      "עמדות חוויה אינטראקטיביות",
      "משחקים תחרותיים לקהל",
      "מתנות ומזכרות ממותגות",
      "ניהול תוכן לרשתות בזמן אמת",
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

export function composeServiceCategoryValue(
  primary: string,
  secondary: string
): string {
  const p = primary.trim();
  const s = secondary.trim();
  if (!p) return "";
  if (!s) return p;
  return `${p}${CATEGORY_VALUE_SEPARATOR}${s}`;
}

export function parseServiceCategoryValue(raw: string): {
  primary: string;
  secondary: string;
} {
  const val = (raw ?? "").trim();
  if (!val) return { primary: "", secondary: "" };
  if (val.includes(CATEGORY_VALUE_SEPARATOR)) {
    const [p, s] = val.split(CATEGORY_VALUE_SEPARATOR, 2);
    return { primary: (p ?? "").trim(), secondary: (s ?? "").trim() };
  }
  return { primary: val, secondary: "" };
}

