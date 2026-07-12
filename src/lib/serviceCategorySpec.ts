import {
  FOOD_BEVERAGE_PRIMARY,
  FREELANCER_CATEGORY_GROUPS,
} from "@/lib/freelancerServiceCategories";

/** מזהה תבנית — מקור אמת יחיד (מיובא ב-serviceCategoryTemplates) */
export type CatalogTemplateId =
  | "food"
  | "beverage"
  | "food_station"
  | "registration"
  | "staffing"
  | "beauty"
  | "fashion_rental"
  | "print_quantity"
  | "photo_video"
  | "music"
  | "tech_av"
  | "equipment_rental"
  | "attraction"
  | "planning"
  | "ceremony"
  | "design"
  | "transport"
  | "corporate"
  | "generic";

/** templateId ישן ב-menuJson — ממופה בקריאה */
export const LEGACY_CATALOG_TEMPLATE_ALIASES: Record<string, CatalogTemplateId> = {
  activation: "attraction",
};

/** שמות קטגoria ישנים בשירותים שמורים */
export const LEGACY_PRIMARY_ALIASES: Record<string, string> = {
  "שירותי קהל ותפעול": "צוותים ותפעול לאירוע",
};

export const LEGACY_SECONDARY_ALIASES: Record<string, string> = {
  "טכנאי הגברה (סאונדמן)": "הגברה לאירועים (סאונדמן)",
  "מפעיל תאורה (לייטמן)": "תאורה לאירועים (לייטמן)",
  "מפעיל במה — סאונד ותאורה": "הגברה לאירועים (סאונדמן)",
  "הגברה ותאורה": "הגברה לאירועים (סאונדמן)",
  "השכרת כלים, זכוכית וציוד הגשה": "השכרת כלים וציוד הגשה",
  "מלצרים / צוות הגשה": "מלצרים",
  "ברמנים / צוות בר": "ברמנים",
  "דיילות וקבלת פנים": "צוות קבלת פנים",
  "השכרת רכב יוקרה / לימוזינה": "השכרת לימוזינה",
  "אוטובוסים / מיניבוסים לאורחים": "אוטובוסים ומיניבוסים לאורחים",
};

/** ברירת מחדל לפי קטגוריה ראשית */
export const PRIMARY_DEFAULT: Record<string, CatalogTemplateId> = {
  [FOOD_BEVERAGE_PRIMARY]: "food",
  "תכנון וניהול אירוע": "planning",
  "צילום ותיעוד": "photo_video",
  "מוזיקה ובמה": "music",
  טקסים: "ceremony",
  "עיצוב ומיתוג": "design",
  "יופי ואיפור": "beauty",
  "הלבשה ואופנה לאירוע": "fashion_rental",
  "הזמנות ודפוס": "print_quantity",
  "אטרקציות ובידור": "attraction",
  "ציוד ולוגיסטיקה": "equipment_rental",
  "צוותים ותפעול לאירוע": "staffing",
  "אירועים עסקיים וכנסים": "corporate",
  אחר: "generic",
};

/** דריסות לתת־קטגוריות שסוטות מברירת המחדל של הראשית */
export const SECONDARY_TEMPLATE_OVERRIDE: Partial<
  Record<string, CatalogTemplateId>
> = {
  // אוכל — משקאות
  "בר משקאות ואלכוהול": "beverage",
  "בר קוקטיילים": "beverage",
  "בר יין": "beverage",
  סומלייה: "beverage",
  "בר קפה": "beverage",
  "בר אקטיבי": "beverage",
  // אוכל — עמדות
  "בר מתוקים": "food_station",
  "עמדת גלידה": "food_station",
  "עמדת וופל בלגי": "food_station",
  "עמדת קרפים": "food_station",
  "עמדת פופקורן": "food_station",
  "עמדת סושי": "food_station",
  // תכנון — רישום
  "שירות אישורי הגעה והושבה": "registration",
  "רישום וצ׳ק-אין אורחים בכניסה": "registration",
  // צילום — אטרקציה
  "צלם מגנטים": "attraction",
  "עמדת צילום לאורחים": "attraction",
  "מראת סלפי": "attraction",
  // מוזיקה — אטרקציה
  "מופעי ריקוד ובמה": "attraction",
  // טקסים — generic
  "הפרחת יונים או פרפרים": "generic",
  // הלבשה — יופי
  "סטיילינג והנחיית לוק לזוג": "beauty",
  // ציוד — טכני
  "הגברה לאירועים (סאונדמן)": "tech_av",
  "תאורה לאירועים (לייטמן)": "tech_av",
  "מסכי LED והקרנה": "tech_av",
  // צוותים — הסעות / generic
  "הסעות אורחים": "transport",
  "השכרת לימוזינה": "transport",
  "אוטובוסים ומיניבוסים לאורחים": "transport",
  "שירותי חניה (Valet)": "transport",
  "ניקיון לפני/במהלך/אחרי": "generic",
  "חובש/פראמדיק לאירוע": "generic",
  "משגיח כשרות לאירוע": "generic",
  "אבטחה וסדרנות": "generic",
  "צוות הקמה ופירוק": "generic",
};

export type SecondaryCatalogHints = {
  packagesHint?: string;
  packageNamePlaceholder?: string;
  packagePriceLabel?: string;
  catalogSectionPlaceholder?: string;
  catalogItemPlaceholder?: string;
  notesPlaceholder?: string;
};

/** placeholders לפי תת־קטגוריה — דריסה חלקית של טקסטי התבנית */
export const SECONDARY_CATALOG_HINTS: Partial<
  Record<string, SecondaryCatalogHints>
> = {
  "קייטרינג חלבי": {
    catalogSectionPlaceholder: "למשל: מנות ראשונות חלביות, עיקריות, קינוחים",
    catalogItemPlaceholder: "למשל: סלט ירקות, פסטה, טירמיסו",
    notesPlaceholder: "למשל: כשר חלבי, אפשרות ללא גלוטן בתיאום",
  },
  "קייטרינג בשרי": {
    catalogSectionPlaceholder: "למשל: מנות ראשונות, בשרים, תוספות, קינוחים",
    catalogItemPlaceholder: "למשל: אנטריקוט, עוף בתנור, סלט ירקות",
    notesPlaceholder: "למשל: כשר בשרי, אפשרות מהדרין בתיאום",
  },
  "קייטרינג צמחוני": {
    catalogSectionPlaceholder: "למשל: מנות ראשונות, עיקריות, קינוחים",
    catalogItemPlaceholder: "למשל: פסטה, קציצות ירק, סלט קינואה",
  },
  "קייטרינג טבעוני": {
    catalogSectionPlaceholder: "למשל: מנות ראשונות, עיקריות, קינוחים",
    catalogItemPlaceholder: "למשל: טופו, קארי ירקות, עוגת שוקולד טבעונית",
  },
  "קייטרינג כשר למהדרין": {
    notesPlaceholder: "למשל: כשרות מהדרין, תעודת משגח, הפרדת בשר וחלב",
  },
  "קייטרינג ללא גלוטן": {
    notesPlaceholder: "למשל: מטבח ללא גלוטן, הפרדת מוצרים",
  },
  "שף פרטי לאירוע": {
    packagesHint: "למשל: ארוחה 3 מנות, ארוחה 5 מנות — מחיר לאורח.",
    packageNamePlaceholder: "למשל: ארוחה 4 מנות",
  },
  "שף על האש": {
    catalogSectionPlaceholder: "למשל: בשרים, תוספות, סלטים",
    catalogItemPlaceholder: "למשל: אנטריקוט, כנפיים, תפוחי אדמה",
  },
  "בר משקאות ואלכוהול": {
    packagesHint:
      "למשל: בר בסיסי 4 שעות ₪3,500, open bar ₪6,000 — מחיר לשירות, לא לאורח.",
    packageNamePlaceholder: "למשל: open bar 4 שעות",
    catalogSectionPlaceholder: "למשל: וודקה, וויסקי, בירות, ללא אלכוהול",
    catalogItemPlaceholder: "למשל: וודקה, ג'ין, בירה, מיץ",
  },
  "בר קוקטיילים": {
    packagesHint: "למשל: בר קוקטיילים 4 שעות — מחיר קבוע לאירוע.",
    packageNamePlaceholder: "למשל: בר קוקטיילים 4 שעות",
    catalogSectionPlaceholder: "למשל: קוקטיילים קלאסיים, קוקטיילים מיוחדים",
    catalogItemPlaceholder: "למשל: מוחיטו, נגרוני, קוקטייל בית",
  },
  "בר יין": {
    packagesHint: "למשל: בר יין לערב — מחיר קבוע לאירוע.",
    packageNamePlaceholder: "למשל: בר יין 5 שעות",
    catalogSectionPlaceholder: "למשל: יינות לבנים, אדומים, מבעבעים",
    catalogItemPlaceholder: "למשל: קברנה, שרדונה, פרוסקו",
  },
  סומלייה: {
    packagesHint: "למשל: ליווי + יינות לערב — מחיר קבוע.",
    packageNamePlaceholder: "למשל: סומלייה לערב",
    catalogSectionPlaceholder: "למשל: יינות לבנים, אדומים, תעודות",
    catalogItemPlaceholder: "למשל: קברנה סוביניון, רוזה פרובנס",
  },
  "בר קפה": {
    packagesHint: "למשל: בר קפה 4 שעות — מחיר קבוע לאירוע.",
    packageNamePlaceholder: "למשל: בר קפה 4 שעות",
    catalogSectionPlaceholder: "למשל: קפה, תה, שוקולד חם",
    catalogItemPlaceholder: "למשל: אספרסו, קפוצ'ינו, לאטה",
  },
  "בר אקטיבי": {
    packagesHint: "למשל: בר אקטיבי לערב — מחיר קבוע לאירוע.",
    packageNamePlaceholder: "למשל: בר אקטיבי 3 שעות",
    catalogSectionPlaceholder: "למשל: משקאות מיוחדים, קוקטיילים, מיצים",
    catalogItemPlaceholder: "למשל: קוקטייל מיוחד, שייק",
  },
  "מזנונים ודוכני אוכל": {
    catalogSectionPlaceholder: "למשל: מנות עיקריות, תוספות, קינוחים",
    catalogItemPlaceholder: "למשל: בשר צלוי, פסטה, סלט",
  },
  "קינוחים ושולחנות מתוקים": {
    catalogSectionPlaceholder: "למשל: עוגות, פטיפורים, פירות",
    catalogItemPlaceholder: "למשל: עוגת שוקולד, מאפינס, פירות העונה",
  },
  "עוגות לאירועים": {
    packagesHint: "מחיר קבוע לפי גודל עוגה — למשל 30 / 50 / 100 מנות.",
    packageNamePlaceholder: "למשל: עוגה 50 מנות",
    packagePriceLabel: "מחיר לעוגה (₪)",
  },
  "בר מתוקים": {
    packagesHint: "למשל: בר מתוקים 3 שעות — מחיר קבוע לאירוע.",
    packageNamePlaceholder: "למשל: בר מתוקים 3 שעות",
    catalogSectionPlaceholder: "למשל: ממתקים, שוקולד, פירות",
    catalogItemPlaceholder: "למשל: טרפלס, בר שוקולד, וופלים",
  },
  "עמדת גלידה": {
    packagesHint: "למשל: עמדת גלידה 3 שעות — מחיר קבוע לאירוע.",
    packageNamePlaceholder: "למשל: עמדה 3 שעות",
    catalogSectionPlaceholder: "למשל: טעמי גלידה",
    catalogItemPlaceholder: "למשל: וניל, שוקולד, פיסטוק",
  },
  "עמדת וופל בלגי": {
    packagesHint: "למשל: עמדת וופל 3 שעות — מחיר קבוע לאירוע.",
    packageNamePlaceholder: "למשל: עמדה 3 שעות",
    catalogSectionPlaceholder: "למשל: וופלים, תוספות",
    catalogItemPlaceholder: "למשל: וופל קלאסי, Nutella, פירות",
  },
  "עמדת קרפים": {
    packagesHint: "למשל: עמדת קרפים 3 שעות — מחיר קבוע לאירוע.",
    packageNamePlaceholder: "למשל: עמדה 3 שעות",
    catalogSectionPlaceholder: "למשל: קרפים מתוקים ומלוחים",
    catalogItemPlaceholder: "למשל: קרפ שוקולד, קרפ גבינה",
  },
  "עמדת פופקורן": {
    packagesHint: "למשל: עמדת פופקורן 3 שעות — מחיר קבוע לאירוע.",
    packageNamePlaceholder: "למשל: עמדה 3 שעות",
    catalogSectionPlaceholder: "למשל: טעמים",
    catalogItemPlaceholder: "למשל: חמאה, קרמל, גבינה",
  },
  "עמדת סושי": {
    packagesHint: "למשל: עמדת סושי 3 שעות — מחיר קבוע לאירוע.",
    packageNamePlaceholder: "למשל: עמדה 3 שעות",
    catalogSectionPlaceholder: "למשל: רולים, ניגירי",
    catalogItemPlaceholder: "למשל: רול ירק, סלמון",
  },
  "הפקת אירועים פרטיים": {
    packagesHint: "למשל: ליווי מלא, חלקי — מחיר קבוע.",
    packageNamePlaceholder: "למשל: הפקה מלאה",
    catalogSectionPlaceholder: "למשל: לפני האירוע, ביום האירוע",
    catalogItemPlaceholder: "למשל: פגישות תכנון, ליווי ספקים",
  },
  "הפקת אירועי חברה/כנסים": {
    packagesHint: "למשל: כנס חד-יומי — מחיר קבוע להפקה.",
    catalogItemPlaceholder: "למשל: ניהול במה, ליווי ספקים",
  },
  "מתאם/ת יום האירוע": {
    packagesHint: "למשל: day-of coordinator — משך שעות + מחיר קבוע.",
    packageNamePlaceholder: "למשל: ליווי יום האירוע",
  },
  "שירות אישורי הגעה והושבה": {
    packagesHint: "למשל: RSVP בלבד / RSVP + הושבה — מחיר קבוע לאירוע.",
    packageNamePlaceholder: "למשל: RSVP + הושבה",
    catalogItemPlaceholder: "למשל: מערכת דיגיטלית, כרטיסי שם",
  },
  "רישום וצ׳ק-אין אורחים בכניסה": {
    packagesHint: "למשל: צוות בכניסה / מערכת רישום — מחיר קבוע לאירוע.",
    packageNamePlaceholder: "למשל: צוות צ'ק-אין",
    catalogItemPlaceholder: "למשל: צוות בדלת, iPad לרישום",
  },
  "צילום סטילס לאירוע": {
    packagesHint: "למשל: 6 שעות + 400 תמונות.",
    packageNamePlaceholder: "למשל: חבילת 8 שעות",
  },
  "צילום וידאו לאירוע": {
    packagesHint: "למשל: Highlights 3–5 דקות, סרט מלא.",
  },
  "צלם מגנטים": {
    packagesHint: "למשל: 4 שעות + מגנטים ללא הגבלה.",
    catalogItemPlaceholder: "למשל: מגנטים ללא הגבלה, אלבום דיגיטלי",
  },
  "עמדת צילום לאורחים": {
    catalogItemPlaceholder: "למשל: הדפסות, GIF, רקע מותאם",
  },
  "מראת סלפי": {
    catalogItemPlaceholder: "למשל: הדפסות, שליחה לוואטסאפ",
  },
  "DJ ותקליטנים": {
    packagesHint: "למשל: קבלת פנים + ריקודים, ערב מלא.",
    catalogSectionPlaceholder: "למשל: קבלת פנים, חופה, ריקודים",
  },
  "זמר חופה / טקס": {
    packageNamePlaceholder: "למשל: 3 שירים בחופה",
  },
  "הנחיה וקריינות": {
    packagesHint: "למשל: לפי שעות — מחיר לשעה או קבוע.",
    packageNamePlaceholder: "למשל: 4 שעות הנחיה",
  },
  "הפרחת יונים או פרפרים": {
    packagesHint: "מחיר קבוע לחבילה — למשל 10 יונים.",
    packageNamePlaceholder: "למשל: 20 יונים",
  },
  "הזמנות מודפסות": {
    catalogSectionPlaceholder: "למשל: הזמנות, save the date",
    catalogItemPlaceholder: "למשל: הזמנה כפולה, כרטיס מקופל",
  },
  "מלצרים": {
    packagesHint: "מחיר לאורח — יחס מלצרים לפי גודל אירוע.",
    catalogItemPlaceholder: "למשל: מלצר נוסף לשעה",
  },
  "אבטחה וסדרנות": {
    packagesHint: "מחיר קבוע לאירוע / לפי שעות צוות — לא לאורח.",
    packageNamePlaceholder: "למשל: אבטחה 6 שעות",
    packagePriceLabel: "מחיר לשירות (₪)",
  },
  "צוות הקמה ופירוק": {
    packagesHint: "מחיר קבוע להקמה ופירוק — לא לאורח.",
    packageNamePlaceholder: "למשל: הקמה ופירוק מלא",
    packagePriceLabel: "מחיר לשירות (₪)",
  },
  "הסעות אורחים": {
    packagesHint: "למשל: שאטל הלוך-חזור — מחיר לנסיעה / לערב.",
    packageNamePlaceholder: "למשל: שאטל הלוך-חזור",
  },
  "השכרת לימוזינה": {
    packagesHint: "למשל: לימוזינה לערב — מחיר קבוע.",
    packageNamePlaceholder: "למשל: לימוזינה 4 שעות",
  },
  "אוטובוסים ומיניבוסים לאורחים": {
    packagesHint: "למשל: אוטובוס הלוך-חזור — מחיר לנסיעה.",
    packageNamePlaceholder: "למשל: אוטובוס הלוך-חזור",
  },
  "שירותי חניה (Valet)": {
    packagesHint: "למשל: Valet לערב — מחיר קבוע לאירוע.",
    packageNamePlaceholder: "למשל: Valet 5 שעות",
  },
  "שידור היברידי": {
    packagesHint: "למשל: שידור ליום כנס — מחיר קבוע לשירות.",
    packageNamePlaceholder: "למשל: שידור היברידי ליום",
  },
  "צילום כנסים ותוכן שיווקי": {
    packagesHint: "למשל: צילום כנס ליום — מחיר קבוע + תוצרים.",
    packageNamePlaceholder: "למשל: צילום כנס ליום",
  },
  "תרגום סימולטני": {
    packagesHint: "למשל: תרגום ליום / לשפה — מחיר קבוע.",
    packageNamePlaceholder: "למשל: תרגום סימולטני ליום",
  },
  "שירותי תמלול ונגישות": {
    packagesHint: "למשל: תמלול ליום — מחיר קבוע.",
    packageNamePlaceholder: "למשל: תמלול ליום",
  },
  "הפקה, עיצוב ומיתוג לכנסים ווובינרים": {
    packagesHint: "למשל: הפקה + מיתוג לכנס — מחיר קבוע.",
    packageNamePlaceholder: "למשל: הפקה מלאה לכנס",
  },
  "שירות אחר": {
    packagesHint: "תארו מה אתם מציעים ומחיר — חבילות חופשיות.",
  },
};

export function normalizeSecondaryName(name: string): string {
  const t = name.trim();
  return LEGACY_SECONDARY_ALIASES[t] ?? t;
}

export function normalizePrimaryName(name: string): string {
  const t = name.trim();
  return LEGACY_PRIMARY_ALIASES[t] ?? t;
}

export function normalizeCatalogTemplateId(
  id: string | null | undefined
): CatalogTemplateId | null {
  if (!id?.trim()) return null;
  const key = id.trim();
  if (key in LEGACY_CATALOG_TEMPLATE_ALIASES) {
    return LEGACY_CATALOG_TEMPLATE_ALIASES[key]!;
  }
  const valid: CatalogTemplateId[] = [
    "food",
    "beverage",
    "food_station",
    "registration",
    "staffing",
    "beauty",
    "fashion_rental",
    "print_quantity",
    "photo_video",
    "music",
    "tech_av",
    "equipment_rental",
    "attraction",
    "planning",
    "ceremony",
    "design",
    "transport",
    "corporate",
    "generic",
  ];
  return valid.includes(key as CatalogTemplateId)
    ? (key as CatalogTemplateId)
    : null;
}

export function resolveTemplateIdForSecondary(
  secondary: string,
  primaryFallback: CatalogTemplateId
): CatalogTemplateId {
  const normalized = normalizeSecondaryName(secondary);
  return SECONDARY_TEMPLATE_OVERRIDE[normalized] ?? primaryFallback;
}

export function buildSecondaryTemplateMap(): Record<string, CatalogTemplateId> {
  const map: Record<string, CatalogTemplateId> = {};
  for (const group of FREELANCER_CATEGORY_GROUPS) {
    const fallback = PRIMARY_DEFAULT[group.primary] ?? "generic";
    for (const service of group.services) {
      map[service] = resolveTemplateIdForSecondary(service, fallback);
    }
  }
  return map;
}

export function getSecondaryCatalogHints(
  secondary: string | null | undefined
): SecondaryCatalogHints | null {
  if (!secondary?.trim()) return null;
  const normalized = normalizeSecondaryName(secondary.trim());
  return SECONDARY_CATALOG_HINTS[normalized] ?? null;
}

/** וידוא שכל 127 תתי־קטגוריות ממופות — נכשל ב-build אם חסר */
export function verifyServiceCategorySpec(): void {
  const map = buildSecondaryTemplateMap();
  let count = 0;
  for (const group of FREELANCER_CATEGORY_GROUPS) {
    for (const service of group.services) {
      count++;
      if (!map[service]) {
        throw new Error(`serviceCategorySpec: חסר מיפוי ל«${service}»`);
      }
    }
  }
  if (count !== 127) {
    throw new Error(
      `serviceCategorySpec: צפויות 127 תתי־קטגוריות, נמצאו ${count}`
    );
  }
}

verifyServiceCategorySpec();
