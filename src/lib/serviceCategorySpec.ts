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
  // אוכל — עוגות (מחיר שירות קבוע, לא לאורח)
  "עוגות לאירועים": "food_station",
  // טקסים — אטרקציה
  "הפרחת יונים או פרפרים": "attraction",
  // הלבשה — יופי
  "סטיילינג והנחיית לוק לזוג": "beauty",
  // ציוד — טכני
  "הגברה לאירועים (סאונדמן)": "tech_av",
  "תאורה לאירועים (לייטמן)": "tech_av",
  "מסכי LED והקרנה": "tech_av",
  // צוותים — הסעות / תפעול (staffing, לא generic)
  "הסעות אורחים": "transport",
  "השכרת לימוזינה": "transport",
  "אוטובוסים ומיניבוסים לאורחים": "transport",
  "שירותי חניה (Valet)": "transport",
  "ניקיון לפני/במהלך/אחרי": "staffing",
  "חובש/פראמדיק לאירוע": "staffing",
  "משגיח כשרות לאירוע": "staffing",
  "אבטחה וסדרנות": "staffing",
  "צוות הקמה ופירוק": "staffing",
};

export type SecondaryCatalogHints = {
  packagesHint?: string;
  packageNamePlaceholder?: string;
  packagePriceLabel?: string;
  catalogSectionPlaceholder?: string;
  catalogItemPlaceholder?: string;
  notesPlaceholder?: string;
  /** דריסות שפה לתת־קטגוריה (למשל תפירה במקום השכרה) */
  editorTitle?: string;
  editorHint?: string;
  capacityTitle?: string;
  capacityHint?: string;
  minCapacityLabel?: string;
  maxCapacityLabel?: string;
  packagesTitle?: string;
  packagesStepLabel?: string;
  catalogStepLabel?: string;
  catalogTitle?: string;
  catalogHint?: string;
  notesLabel?: string;
  packageNameFieldLabel?: string;
  packageDescriptionFieldLabel?: string;
  packageDescriptionPlaceholder?: string;
  packagePriceExpandLabel?: string;
  packageIncludedTitle?: string;
  packageIncludedHint?: string;
  packageIncludedItemPlaceholder?: string;
  packageIncludedAddLabel?: string;
  packageCardNoun?: string;
  packageCardDetail?: string;
  packageRemoveLabel?: string;
  packageDurationLabel?: string;
  packageDurationPlaceholder?: string;
  showPackageDuration?: boolean;
  requireGuestCountInquiry?: boolean;
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
  "בר מתוקים": {
    packagesHint: "רשמו מה מוכרים, לכמה שעות, ומה המחיר. השעות — רק בשדה «לכמה זמן».",
    packageNamePlaceholder: "למשל: בר מתוקים",
    packageIncludedTitle: "מתוקים שכלולים במחיר",
    packageIncludedHint: "מה כלול במחיר — בלי תוספת תשלום.",
    packageIncludedItemPlaceholder: "למשל: טרפלס, בר שוקולד",
    packageIncludedAddLabel: "+ הוסף מתוק",
    catalogSectionPlaceholder: "למשל: שדרוגים בתשלום",
    catalogItemPlaceholder: "למשל: מגדל ממתקים",
  },
  "עמדת גלידה": {
    packagesHint: "רשמו מה מוכרים, לכמה שעות, ומה המחיר. השעות — רק בשדה «לכמה זמן».",
    packageNamePlaceholder: "למשל: עמדת גלידה",
    packageIncludedTitle: "טעמי גלידה שכלולים במחיר",
    packageIncludedHint: "הטעמים שכלולים במחיר — בלי תוספת תשלום.",
    packageIncludedItemPlaceholder: "למשל: וניל, שוקולד, פיסטוק",
    packageIncludedAddLabel: "+ הוסף טעם",
    catalogSectionPlaceholder: "למשל: תוספות בתשלום",
    catalogItemPlaceholder: "למשל: גביע וופל גדול",
  },
  "עמדת וופל בלגי": {
    packagesHint: "רשמו מה מוכרים, לכמה שעות, ומה המחיר. השעות — רק בשדה «לכמה זמן».",
    packageNamePlaceholder: "למשל: עמדת וופל",
    packageIncludedTitle: "סוגי וופל / תוספות שכלולים במחיר",
    packageIncludedHint: "מה כלול במחיר — בלי תוספת תשלום.",
    packageIncludedItemPlaceholder: "למשל: וופל קלאסי, Nutella, פירות",
    packageIncludedAddLabel: "+ הוסף סוג / תוספת",
    catalogSectionPlaceholder: "למשל: תוספות בתשלום",
    catalogItemPlaceholder: "למשל: גלידה על הוופל",
  },
  "עמדת קרפים": {
    packagesHint: "רשמו מה מוכרים, לכמה שעות, ומה המחיר. השעות — רק בשדה «לכמה זמן».",
    packageNamePlaceholder: "למשל: עמדת קרפים",
    packageIncludedTitle: "סוגי קרפים שכלולים במחיר",
    packageIncludedHint: "המילויים שכלולים במחיר — בלי תוספת תשלום.",
    packageIncludedItemPlaceholder: "למשל: קרפ שוקולד, קרפ גבינה",
    packageIncludedAddLabel: "+ הוסף סוג קרפ",
    catalogSectionPlaceholder: "למשל: תוספות בתשלום",
    catalogItemPlaceholder: "למשל: תוספת Nutella",
  },
  "עמדת פופקורן": {
    packagesHint: "רשמו מה מוכרים, לכמה שעות, ומה המחיר. השעות — רק בשדה «לכמה זמן».",
    packageNamePlaceholder: "למשל: עמדת פופקורן",
    packageIncludedTitle: "טעמי פופקורן שכלולים במחיר",
    packageIncludedHint: "הטעמים שכלולים במחיר — בלי תוספת תשלום.",
    packageIncludedItemPlaceholder: "למשל: חמאה, קרמל, גבינה",
    packageIncludedAddLabel: "+ הוסף טעם",
    catalogSectionPlaceholder: "למשל: תוספות בתשלום",
    catalogItemPlaceholder: "למשל: דלי גדול",
  },
  "עמדת סושי": {
    packagesHint: "רשמו מה מוכרים, לכמה שעות, ומה המחיר. השעות — רק בשדה «לכמה זמן».",
    packageNamePlaceholder: "למשל: עמדת סושי",
    packageIncludedTitle: "מנות / רולים שכלולים במחיר",
    packageIncludedHint: "מה כלול במחיר — בלי תוספת תשלום.",
    packageIncludedItemPlaceholder: "למשל: רול ירק, סלמון",
    packageIncludedAddLabel: "+ הוסף מנה",
    catalogSectionPlaceholder: "למשל: תוספות בתשלום",
    catalogItemPlaceholder: "למשל: סשימי בתוספת",
  },
  "עוגות לאירועים": {
    editorTitle: "עוגות — גודל ומחיר",
    packagesTitle: "מה מוכרים וכמה עולה",
    packagesHint: "רשמו גודל העוגה ואת המחיר. אין צורך בשעות — זה מוצר, לא עמדה.",
    packageNameFieldLabel: "מה אתם מוכרים",
    packageNamePlaceholder: "למשל: עוגה 50 מנות",
    packagePriceLabel: "מחיר (₪)",
    packageCardNoun: "עוגה",
    packageCardDetail: "גודל, מחיר וטעמים",
    packageRemoveLabel: "הסר עוגה",
    showPackageDuration: false,
    packageIncludedTitle: "טעמים ועיטורים שכלולים במחיר",
    packageIncludedHint: "מה כלול במחיר העוגה — בלי תוספת תשלום.",
    packageIncludedItemPlaceholder: "למשל: שוקולד בלגי, פרחים ממותקים",
    packageIncludedAddLabel: "+ הוסף טעם / עיטור",
    catalogSectionPlaceholder: "למשל: שדרוגים בתשלום",
    catalogItemPlaceholder: "למשל: טופר ממותג",
    notesPlaceholder: "למשל: חלבי, ללא גלוטן בתיאום, זמן הזמנה 10 ימים",
  },
  "הפקת אירועים פרטיים": {
    packagesHint: "למשל: ליווי מלא, חלקי — מחיר קבוע.",
    packageNamePlaceholder: "למשל: הפקה מלאה",
    catalogSectionPlaceholder: "למשל: לפני האירוע, ביום האירוע",
    catalogItemPlaceholder: "למשל: פגישות תכנון, ליווי ספקים",
  },
  "הצעות נישואין": {
    editorTitle: "הצעות נישואין — חבילות ומחיר",
    editorHint:
      "לכל חבילה: שם + מחיר + מה כלול ברגע ההצעה. תוספות בתשלום (צלם נסתר, נגן…) — למטה, אופציונלי.",
    capacityTitle: "אורחים ברגע ההצעה",
    capacityHint:
      "כמה אנשים יכולים להיות ברגע עצמו (רק הזוג / עם משפחה וחברים) — עוזר להתאמה, לא בהכרח לתמחור.",
    minCapacityLabel: "מינימום אורחים",
    maxCapacityLabel: "מקסימום אורחים",
    packagesTitle: "חבילות הצעה",
    packagesHint:
      "חבילה לכל הצעה — למשל «הצעה בטבע», «חבילה מלאה עם עיצוב וצילום». שם + מחיר + מה כלול במחיר.",
    packagesStepLabel: "מחיר + מה כלול בהצעה",
    catalogStepLabel: "תוספות בתשלום (אופציונלי)",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "אין מחיר קבוע — אציג טווח",
    packageNameFieldLabel: "שם החבילה",
    packageNamePlaceholder: "למשל: הצעה בטבע + עיצוב",
    packageDescriptionFieldLabel: "הערות (אופציונלי)",
    packageDescriptionPlaceholder: "למשל: כולל תיאום עם הלוקיישן",
    packageIncludedTitle: "מה כלול בהצעה הזו",
    packageIncludedHint:
      "רק מה שנכלל במחיר החבילה — לוקיישן, עיצוב, הקמה, תיאום וכו'.",
    packageIncludedItemPlaceholder: "למשל: בחירת לוקיישן, עיצוב פרחים, הקמה",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    packageCardNoun: "חבילה",
    packageCardDetail: "שם, מחיר ומה כלול",
    packageRemoveLabel: "הסר חבילה",
    catalogTitle: "תוספות בתשלום",
    catalogHint:
      "שירותים בתוספת מחיר מעבר לחבילה — צילום נסתר, נגן, שמפניה, רחפן וכו'.",
    catalogSectionPlaceholder: "למשל: צילום, מוזיקה, עיצוב נוסף",
    catalogItemPlaceholder: "למשל: צלם נסתר, כינור, מגדל שמפניה",
    notesLabel: "הערות ללקוח",
    notesPlaceholder:
      "למשל: נסיעה עד 40 ק״מ כלולה, תיאום סודי עם השותף/ה, ביטול לפי מדיניות",
    showPackageDuration: true,
    requireGuestCountInquiry: false,
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
    catalogItemPlaceholder: "למשל: סדרן נוסף לשעה",
    notesPlaceholder: "למשל: כולל תיאום עם האולם, מדים",
  },
  "צוות הקמה ופירוק": {
    packagesHint: "מחיר קבוע להקמה ופירוק — לא לאורח.",
    packageNamePlaceholder: "למשל: הקמה ופירוק מלא",
    packagePriceLabel: "מחיר לשירות (₪)",
    catalogItemPlaceholder: "למשל: שעת הקמה נוספת",
    notesPlaceholder: "למשל: כולל כלי עבודה, נסיעה עד 40 ק״מ",
  },
  "ניקיון לפני/במהלך/אחרי": {
    packagesHint: "מחיר קבוע לאירוע / לפי שעות צוות — לא לאורח.",
    packageNamePlaceholder: "למשל: ניקיון אחרי אירוע",
    packagePriceLabel: "מחיר לשירות (₪)",
    catalogItemPlaceholder: "למשל: ניקיון מטבח נוסף",
    notesPlaceholder: "למשל: חומרי ניקוי כלולים",
  },
  "חובש/פראמדיק לאירוע": {
    packagesHint: "מחיר קבוע לאירוע לפי שעות נוכחות — לא לאורח.",
    packageNamePlaceholder: "למשל: חובש 6 שעות",
    packagePriceLabel: "מחיר לשירות (₪)",
    catalogItemPlaceholder: "למשל: שעת הארכה",
    notesPlaceholder: "למשל: ציוד עזרה ראשונה כלול",
  },
  "משגיח כשרות לאירוע": {
    packagesHint: "מחיר קבוע לאירוע / לפי שעות — לא לאורח.",
    packageNamePlaceholder: "למשל: משגיח לערב",
    packagePriceLabel: "מחיר לשירות (₪)",
    notesPlaceholder: "למשל: תעודת השגחה, תיאום עם המטבח",
  },
  "צוות קבלת פנים": {
    packagesHint: "מחיר לאורח או לחבילת צוות — לפי יחס דיילות.",
    packageNamePlaceholder: "למשל: קבלת פנים 4 דיילות",
    catalogItemPlaceholder: "למשל: דיילת נוספת לשעה",
  },
  ברמנים: {
    packagesHint: "מחיר לשעת ברמן או לחבילת ערב — לא בהכרח לאורח.",
    packageNamePlaceholder: "למשל: ברמן 5 שעות",
    packagePriceLabel: "מחיר לשירות (₪)",
    catalogItemPlaceholder: "למשל: ברמן נוסף לשעה",
  },
  "שמלות כלה — השכרה": {
    packagesHint: "למשל: שמלת כלה + אקססוריז — מחיר להשכרה.",
    packageNamePlaceholder: "למשל: שמלה + רעלה",
    catalogItemPlaceholder: "למשל: שמלה מידה 38",
    notesPlaceholder: "למשל: פיקדון, ניקוי, החזרה תוך 3 ימים",
  },
  "שמלות כלה — תפירה והתאמות": {
    editorTitle: "תפירה והתאמות",
    editorHint:
      "מחיר לתפירה / להתאמה לפי דגם ומידות — לא השכרה. ציינו מועד מסירה וסבבי מדידות.",
    capacityTitle: "היקף הזמנות",
    capacityHint: "כמה הזמנות במקביל אתם מקבלים לתקופה.",
    minCapacityLabel: "מינימום ימי עבודה",
    maxCapacityLabel: "מקסימום הזמנות במקביל",
    packagesTitle: "חבילות תפירה",
    packagesHint: "למשל: תפירה מלאה, התאמות בלבד — מחיר לתפירה.",
    packageNamePlaceholder: "למשל: תפירה מלאה + 3 מדידות",
    packagePriceLabel: "מחיר לתפירה (₪)",
    catalogTitle: "שירותי תפירה",
    catalogHint: "התאמות, רפליקה, תוספות בד — עם מחיר.",
    catalogSectionPlaceholder: "למשל: תפירה, התאמות",
    catalogItemPlaceholder: "למשל: קיצור שובל",
    notesLabel: "מועד מסירה ותנאים",
    notesPlaceholder: "למשל: מסירה 8 שבועות לפני האירוע, 3 מדידות כלולות",
  },
  "חליפות חתן — השכרה": {
    packagesHint: "למשל: חליפה + עניבה — מחיר להשכרה.",
    packageNamePlaceholder: "למשל: חליפת חתן מלאה",
    catalogItemPlaceholder: "למשל: חליפה מידה 50",
  },
  "חליפות חתן — תפור": {
    editorTitle: "חליפות תפורות",
    editorHint: "מחיר לתפירה לפי מידות — לא השכרה. ציינו מועד מסירה.",
    capacityTitle: "היקף הזמנות",
    capacityHint: "כמה הזמנות במקביל.",
    minCapacityLabel: "מינימום ימי עבודה",
    maxCapacityLabel: "מקסימום הזמנות במקביל",
    packagesTitle: "חבילות תפירה",
    packagesHint: "למשל: חליפה תפורה מלאה — מחיר לתפירה.",
    packageNamePlaceholder: "למשל: חליפה תפורה + אפודה",
    packagePriceLabel: "מחיר לתפירה (₪)",
    catalogTitle: "שירותי תפירה",
    catalogItemPlaceholder: "למשל: התאמת מכנסיים",
    notesLabel: "מועד מסירה ותנאים",
    notesPlaceholder: "למשל: מסירה 6 שבועות לפני, 2 מדידות",
  },
  "שמלה שנייה לריקודים": {
    editorTitle: "שמלה שנייה — תפירה / התאמה",
    editorHint: "מחיר לתפירה או להשכרה של שמלה שנייה — ציינו מה כלול.",
    packagesHint: "למשל: שמלה שנייה לתפירה / להשכרה — מחיר לחבילה.",
    packageNamePlaceholder: "למשל: שמלה שנייה קצרה",
    packagePriceLabel: "מחיר (₪)",
    notesPlaceholder: "למשל: מועד מסירה, מידות",
  },
  "שמלת ערב": {
    packagesHint: "השכרה או רכישה — מחיר לחבילה / לדגם.",
    packageNamePlaceholder: "למשל: שמלת ערב מידה 40",
  },
  "תכשיטים, נעליים ואקסוריז לכלה": {
    packagesHint: "השכרה או רכישה — מחיר לפריט / לחבילה.",
    packageNamePlaceholder: "למשל: סט תכשיטים",
    catalogItemPlaceholder: "למשל: עגילים, נעליים",
  },
  "רב לטקס": {
    packagesHint: "מחיר קבוע לטקס — כולל/לא כולל פגישת היכרות.",
    packageNamePlaceholder: "למשל: טקס חופה מלא",
    catalogItemPlaceholder: "למשל: פגישת היכרות",
  },
  "עורך טקס": {
    packagesHint: "מחיר קבוע לטקס חילוני / אישי.",
    packageNamePlaceholder: "למשל: טקס אישי",
  },
  מוהל: {
    packagesHint: "מחיר קבוע לברית — ציינו מה כלול.",
    packageNamePlaceholder: "למשל: ברית מלאה",
  },
  "עורך דין לטקס חילוני": {
    packagesHint: "מחיר קבוע לטקס + ייעוץ רישום.",
    packageNamePlaceholder: "למשל: טקס + ליווי רישום",
  },
  "מדריך בר/בת מצווה בכותל": {
    packagesHint: "מחיר קבוע להדרכה / לטקס בכותל.",
    packageNamePlaceholder: "למשל: הדרכה + טקס",
  },
  "הפרחת יונים או פרפרים": {
    packagesHint: "מחיר קבוע לחבילה — למשל 10 יונים / פרפרים.",
    packageNamePlaceholder: "למשל: 20 יונים",
    catalogItemPlaceholder: "למשל: תוספת 10 יונים",
    notesPlaceholder: "למשל: דורש אישור מקום, מזג אוויר",
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

/** וידוא שכל 128 תתי־קטגוריות ממופות — נכשל ב-build אם חסר */
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
  if (count !== 128) {
    throw new Error(
      `serviceCategorySpec: צפויות 128 תתי־קטגוריות, נמצאו ${count}`
    );
  }
}

verifyServiceCategorySpec();
