import {
  parseServiceCategorySelections,
} from "@/lib/freelancerServiceCategories";
import {
  buildSecondaryTemplateMap,
  getSecondaryCatalogHints,
  normalizeCatalogTemplateId,
  normalizePrimaryName,
  normalizeSecondaryName,
  PRIMARY_DEFAULT,
  type CatalogTemplateId,
} from "@/lib/serviceCategorySpec";

export type { CatalogTemplateId };

export type CatalogTemplate = {
  id: CatalogTemplateId;
  editorTitle: string;
  editorHint: string;
  /** כותרת בלוק קיבולת */
  capacityTitle: string;
  capacityHint: string;
  minCapacityLabel: string;
  maxCapacityLabel: string;
  packagesTitle: string;
  packagesHint: string;
  packagePriceLabel: string;
  packagePriceExpandLabel: string;
  catalogTitle: string;
  catalogHint: string;
  catalogSectionPlaceholder: string;
  catalogItemPlaceholder: string;
  notesLabel: string;
  notesPlaceholder: string;
  showGuestCapacity: boolean;
  showPersonCapacity: boolean;
  showQuantityTiers: boolean;
  showDeliverables: boolean;
  showPackageDuration: boolean;
  requireGuestCountInquiry: boolean;
  requirePersonCountInquiry: boolean;
  requireQuantityInquiry: boolean;
  /** בלוק תוספות/פירוט מוסתר בהתחלה — רק למי שצריך */
  catalogOptional?: boolean;
  /** placeholder לשם חבילה — מ-SECONDARY_CATALOG_HINTS */
  packageNamePlaceholder?: string;
  itemPricingModes: Array<
    "included" | "per_guest" | "per_guest_range" | "fixed" | "per_unit" | "per_hour"
  >;
};

const TEMPLATES: Record<CatalogTemplateId, CatalogTemplate> = {
  food: {
    id: "food",
    editorTitle: "תפריט ומחירי אוכל",
    editorHint:
      "הגדירו כמה אורחים אתם משרתים, רמות מחיר לאורח ופירוט מנות — כדי שהלקוח יידע מה מקבל ובכמה.",
    capacityTitle: "קיבולת אורחים",
    capacityHint: "טווח האורחים שאתם יכולים להכין ולשרת באירוע.",
    minCapacityLabel: "מינימום אורחים *",
    maxCapacityLabel: "מקסימום אורחים *",
    packagesTitle: "רמות מחיר (לפי אורח)",
    packagesHint:
      "לא חבילת סלולר — שם + כמה ₪ לאורח אחד. למשל «מנה בסיסית» 120₪, «פרימיום» 200₪.",
    packagePriceLabel: "מחיר לאורח (₪)",
    packagePriceExpandLabel: "אין מחיר קבוע — אציג טווח לאורח",
    catalogTitle: "תפריט מנות",
    catalogHint:
      "רשימת המנות שלכם — לכל מנה: כלולה במחיר לאורח או בתוספת תשלום (למשל סטייק +₪30 לאורח).",
    catalogSectionPlaceholder: "למשל: מנות ראשונות, עיקריות, קינוחים",
    catalogItemPlaceholder: "למשל: סלט ירוק, בשר צלוי",
    notesLabel: "הערות לתפריט (כשרות, אלרגנים)",
    notesPlaceholder: "למשל: כשר למהדרין, אפשרות ללא גלוטן בתיאום",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: false,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "per_guest", "per_guest_range", "fixed", "per_unit"],
  },
  beverage: {
    id: "beverage",
    editorTitle: "בר משקאות ומחירים",
    editorHint:
      "הגדירו רמות open bar, מחיר לאורח ורשימת משקאות — קוקטיילים, יינות, בירות וללא אלכוהול.",
    capacityTitle: "קיבולת אורחים",
    capacityHint: "טווח האורחים שאתם משרתים בבר.",
    minCapacityLabel: "מינימום אורחים *",
    maxCapacityLabel: "מקסימום אורחים *",
    packagesTitle: "רמות בר (לפי אורח)",
    packagesHint:
      "למשל: «בר בסיסי» 80₪ לאורח, «open bar פרימיום» 150₪ לאורח.",
    packagePriceLabel: "מחיר לאורח (₪)",
    packagePriceExpandLabel: "אין מחיר קבוע — אציג טווח לאורח",
    catalogTitle: "רשימת משקאות",
    catalogHint:
      "קוקטיילים, יינות, בירות, קפה — לכל פריט: כלול / תוספת לאורח / מחיר קבוע.",
    catalogSectionPlaceholder: "למשל: קוקטיילים, יינות, בירות, ללא אלכוהול",
    catalogItemPlaceholder: "למשל: מוחיטו, קברנה, בירה, מיץ",
    notesLabel: "הערות (כשרות, הגבלות)",
    notesPlaceholder: "למשל: בר כשר, ללא אלכוהול זמין",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: true,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "per_guest", "per_guest_range", "fixed"],
  },
  food_station: {
    id: "food_station",
    editorTitle: "עמדת מזון ומחירים",
    editorHint:
      "הגדירו משך הפעלה, מחיר (קבוע או לאורח) וטעמים/מנות בעמדה — גלידה, וופל, סושי וכו'.",
    capacityTitle: "קיבולת אורחים",
    capacityHint: "כמה אורחים אתם משרתים בעמדה באירוע.",
    minCapacityLabel: "מינימום אורחים *",
    maxCapacityLabel: "מקסימום אורחים *",
    packagesTitle: "חבילות עמדה",
    packagesHint:
      "למשל: 3 שעות / עד 200 מנות — מחיר קבוע או מחיר לאורח.",
    packagePriceLabel: "מחיר לחבילה / לאורח (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    catalogTitle: "טעמים ומנות בעמדה",
    catalogHint: "רשימת טעמים או מנות — כלול או בתוספת תשלום.",
    catalogSectionPlaceholder: "למשל: טעמים, תוספות, מנות",
    catalogItemPlaceholder: "למשל: וניל, שוקולד, Nutella",
    notesLabel: "הערות (כשרות, אלרגנים)",
    notesPlaceholder: "למשל: חלבי/בשרי, ללא גלוטן בתיאום",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: true,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "per_guest", "fixed", "per_unit"],
  },
  registration: {
    id: "registration",
    editorTitle: "רישום, RSVP והושבה",
    editorHint:
      "הגדירו חבילות RSVP, הושבה וצ'ק-אין — מחיר קבוע לאירוע או לאורח.",
    capacityTitle: "קיבולת אורחים",
    capacityHint: "טווח האורחים שאתם מלווים באירוע.",
    minCapacityLabel: "מינימום אורחים *",
    maxCapacityLabel: "מקסימום אורחים *",
    packagesTitle: "חבילות שירות",
    packagesHint:
      "למשל: RSVP בלבד, RSVP + הושבה, צוות בכניסה.",
    packagePriceLabel: "מחיר (₪) — קבוע או לאורח",
    packagePriceExpandLabel: "טווח מחיר",
    catalogTitle: "שירותים כלולים",
    catalogHint: "מערכת דיגיטלית, כרטיסי שם, צוות בדלת — עם מחיר אם רלוונטי.",
    catalogSectionPlaceholder: "למשל: דיגיטלי, הושבה, כניסה",
    catalogItemPlaceholder: "למשל: מערכת RSVP, כרטיסי שם",
    notesLabel: "הערות",
    notesPlaceholder: "למשל: כולל הדרכה לפני האירוע",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: false,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "fixed", "per_guest"],
  },
  staffing: {
    id: "staffing",
    editorTitle: "צוות ותמחור לפי אורחים",
    editorHint:
      "הגדירו כמה אורחים אתם מכסים, חבילות צוות ומה כלול (שעות, תפקידים, מדים).",
    capacityTitle: "קיבולת אורחים",
    capacityHint: "לאיזה גודל אירוע אתם מתאימים — משפיע על גודל הצוות.",
    minCapacityLabel: "מינימום אורחים *",
    maxCapacityLabel: "מקסימום אורחים *",
    packagesTitle: "חבילות צוות",
    packagesHint: "למשל: צוות בסיס (מלצרים לפי יחס), צוות מורחב עם ברמן.",
    packagePriceLabel: "מחיר לאורח (₪)",
    packagePriceExpandLabel: "טווח מחיר לאורח",
    catalogTitle: "תפקידים ושירותים",
    catalogHint: "פירוט תפקידים, שעות מינימום ותוספות (ברמן נוסף, מנהל קבלה).",
    catalogSectionPlaceholder: "למשל: הגשה, בר, קבלת פנים",
    catalogItemPlaceholder: "למשל: מלצר נוסף לשעה",
    notesLabel: "הערות תפעול",
    notesPlaceholder: "למשל: מינימום 4 שעות, מדים כלולים",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: true,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "per_guest", "per_hour", "fixed"],
  },
  beauty: {
    id: "beauty",
    editorTitle: "מחירון השירות",
    editorHint:
      "במקום מחיר אחד כללי — רשמו לכל סוג לקוח כמה אתם גובים (כלה, אורחת, חתן). זה מה שמחפשים רואים בכרטיס.",
    capacityTitle: "כמה לקוחות ביום אירוע?",
    capacityHint: "מינימום ומקסימום אנשים שאתם יכולים לטפל בהם באותו יום.",
    minCapacityLabel: "מינימום אנשים *",
    maxCapacityLabel: "מקסימום אנשים *",
    packagesTitle: "סוגי שירות ומחירים",
    packagesHint:
      "שורה לכל סוג — למשל «איפור כלה מלא» ב-₪2,500, «איפור אורחת» ב-₪450. לחצו «הוסף שורת מחיר» לעוד סוגים.",
    packagePriceLabel: "מחיר (₪)",
    packagePriceExpandLabel: "אין מחיר קבוע — הציגו טווח",
    catalogTitle: "תוספות בתשלום",
    catalogHint: "רק אם יש שירותים נפרדים עם מחיר — ניסיון איפור, ליווי לחינה וכו'.",
    catalogSectionPlaceholder: "קבוצה (אופציונלי)",
    catalogItemPlaceholder: "למשל: ניסיון איפור",
    notesLabel: "הערות ללקוח",
    notesPlaceholder: "למשל: נסיעה עד 30 ק״מ כלולה",
    showGuestCapacity: false,
    showPersonCapacity: true,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: false,
    requireGuestCountInquiry: false,
    requirePersonCountInquiry: true,
    requireQuantityInquiry: false,
    catalogOptional: true,
    itemPricingModes: ["included", "per_unit", "fixed"],
  },
  fashion_rental: {
    id: "fashion_rental",
    editorTitle: "קטלוג השכרה והתאמות",
    editorHint: "דגמים, מידות, ימי השכרה ומחיר — לשמלות, חליפות ואקססוריז.",
    capacityTitle: "מלאי וקיבולת",
    capacityHint: "כמה לקוחות במקביל או כמה פריטים זמינים.",
    minCapacityLabel: "מינימום ימי השכרה",
    maxCapacityLabel: "מקסימום פריטים במלאי",
    packagesTitle: "חבילות השכרה",
    packagesHint: "למשל: שמלת כלה + אקססוריז, חליפת חתן.",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר לחבילה",
    catalogTitle: "פריטים בקטלוג",
    catalogHint: "פריטים בודדים עם מחיר השכרה והתאמות.",
    catalogSectionPlaceholder: "למשל: שמלות, חליפות, תכשיטים",
    catalogItemPlaceholder: "למשל: שמלה מידה 38",
    notesLabel: "תנאי השכרה",
    notesPlaceholder: "למשל: פיקדון, ניקוי, החזרה תוך 3 ימים",
    showGuestCapacity: false,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: true,
    requireGuestCountInquiry: false,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "fixed", "per_unit"],
  },
  print_quantity: {
    id: "print_quantity",
    editorTitle: "מוצרים ומחיר לפי כמות",
    editorHint: "הזמנות, place cards ודפוס — מחיר ליחידה לפי מדרגות כמות.",
    capacityTitle: "טווח כמויות",
    capacityHint: "מינימום ומקסימום יחידות בהזמנה אחת.",
    minCapacityLabel: "מינימום יחידות *",
    maxCapacityLabel: "מקסימום יחידות *",
    packagesTitle: "חבילות עיצוב",
    packagesHint: "למשל: עיצוב בסיסי, עיצוב פרימיום + קליגרפיה.",
    packagePriceLabel: "מחיר ליחידה (₪)",
    packagePriceExpandLabel: "טווח מחיר ליחידה",
    catalogTitle: "סוגי מוצרים",
    catalogHint: "הזמנה, save the date, תפריט שולחן — עם מחיר ליחידה.",
    catalogSectionPlaceholder: "למשל: הזמנות, שולחן",
    catalogItemPlaceholder: "למשל: הזמנה כפולה",
    notesLabel: "הערות דפוס",
    notesPlaceholder: "למשל: זמן אספקה 3 שבועות, כולל הדפסה",
    showGuestCapacity: false,
    showPersonCapacity: false,
    showQuantityTiers: true,
    showDeliverables: false,
    showPackageDuration: false,
    requireGuestCountInquiry: false,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: true,
    itemPricingModes: ["included", "per_unit", "fixed"],
  },
  photo_video: {
    id: "photo_video",
    editorTitle: "חבילות צילום / וידאו",
    editorHint: "שעות כיסוי, תוצרים (תמונות, דקות וידאו) ותוספות — לכל חבילה מחיר.",
    capacityTitle: "היקף אירוע",
    capacityHint: "גודל אירוע מומלץ או מקסימום אורחים לכיסוי מלא.",
    minCapacityLabel: "מינימום אורחים (אופציונלי)",
    maxCapacityLabel: "מקסימום אורחים (אופציונלי)",
    packagesTitle: "חבילות שירות",
    packagesHint: "למשל: 6 שעות + 400 תמונות, וידאו Highlights.",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר לחבילה",
    catalogTitle: "תוספות ותוצרים",
    catalogHint: "צלם שני, רחפן, אלבום, Same-day — עם מחיר.",
    catalogSectionPlaceholder: "למשל: תוספות, תוצרים",
    catalogItemPlaceholder: "למשל: צלם שני",
    notesLabel: "הערות מקצועיות",
    notesPlaceholder: "למשל: זמן אספקה גלריה 4–6 שבועות",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: true,
    showPackageDuration: true,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "fixed", "per_hour"],
  },
  music: {
    id: "music",
    editorTitle: "חבילות מוזיקה והופעה",
    editorHint: "משך הופעה, הרכב, ציוד כלול ותוספות — לפי קטעי האירוע.",
    capacityTitle: "היקף אירוע",
    capacityHint: "גודל אולם / אורחים שההרכב מתאים לו.",
    minCapacityLabel: "מינימום אורחים",
    maxCapacityLabel: "מקסימום אורחים",
    packagesTitle: "חבילות הופעה",
    packagesHint: "למשל: DJ לקבלת פנים + ריקודים, זמר חופה + 3 שירים.",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    catalogTitle: "תוספות וציוד",
    catalogHint: "נגן נוסף, הגברה, שיר בקשה.",
    catalogSectionPlaceholder: "למשל: קבלת פנים, חופה, ריקודים",
    catalogItemPlaceholder: "למשל: שיר בקשה",
    notesLabel: "הערות",
    notesPlaceholder: "למשל: הגברה בסיסית כלולה",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: true,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "fixed", "per_hour"],
  },
  tech_av: {
    id: "tech_av",
    editorTitle: "הגברה, תאורה וטכני",
    editorHint: "שעות עבודה, ציוד כלול ותוספות טכניות לאירוע.",
    capacityTitle: "היקף טכני",
    capacityHint: "גודל אולם / כמות אורחים שהמערכת מכסה.",
    minCapacityLabel: "מינימום אורחים",
    maxCapacityLabel: "מקסימום אורחים",
    packagesTitle: "חבילות טכניות",
    packagesHint: "למשל: סאונד בסיסי, סאונד+לייט מלא.",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    catalogTitle: "ציוד ושעות נוספות",
    catalogHint: "מיקרופון נוסף, שעת טכנאי, מסך LED.",
    catalogSectionPlaceholder: "למשל: הגברה, תאורה",
    catalogItemPlaceholder: "למשל: מיקרופון אלחוטי",
    notesLabel: "דרישות מקום",
    notesPlaceholder: "למשל: נקודת חשמל, גישה להקמה",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: true,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "fixed", "per_hour"],
  },
  equipment_rental: {
    id: "equipment_rental",
    editorTitle: "קטלוג השכרת ציוד",
    editorHint: "פריטים, מחיר ליום / לאירוע, כמות במלאי והובלה.",
    capacityTitle: "מלאי",
    capacityHint: "כמות פריטים זמינה או גודל אירוע מקסימלי.",
    minCapacityLabel: "מינימום ימי השכרה",
    maxCapacityLabel: "מקסימום פריטים",
    packagesTitle: "חבילות ציוד",
    packagesHint: "למשל: 10 שולחנות + 80 כיסאות + מפות.",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    catalogTitle: "פריטים להשכרה",
    catalogHint: "כל פריט — מחיר ליום או לאירוע וכמות זמינה.",
    catalogSectionPlaceholder: "למשל: ריהוט, במה, אוהלים",
    catalogItemPlaceholder: "למשל: שולחן עגול",
    notesLabel: "הובלה והקמה",
    notesPlaceholder: "למשל: הובלה עד 50 ק״מ כלולה",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: true,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "fixed", "per_unit", "per_hour"],
  },
  attraction: {
    id: "attraction",
    editorTitle: "אטרקציה ומחיר",
    editorHint: "משך הפעלה, קיבולת קהל ומה כלול בחבילה.",
    capacityTitle: "קיבולת קהל",
    capacityHint: "כמה משתתפים בו-זמנית או באירוע.",
    minCapacityLabel: "מינימום משתתפים",
    maxCapacityLabel: "מקסימום משתתפים",
    packagesTitle: "חבילות אטרקציה",
    packagesHint: "למשל: שעה הפעלה, ערב מלא עם 2 אמנים.",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    catalogTitle: "תוספות",
    catalogHint: "שעה נוספת, אביזרים, דמות נוספת.",
    catalogSectionPlaceholder: "למשל: תוספות",
    catalogItemPlaceholder: "למשל: שעת הארכה",
    notesLabel: "דרישות מקום",
    notesPlaceholder: "למשל: שטח 3×3 מ׳, חשמל",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: true,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "fixed", "per_hour"],
  },
  planning: {
    id: "planning",
    editorTitle: "חבילות תכנון וניהול",
    editorHint: "סוג ליווי (מלא / יום האירוע), היקף שירות ומחיר.",
    capacityTitle: "היקף אירוע",
    capacityHint: "גודל אירוע אופייני שאתם מלווים.",
    minCapacityLabel: "מינימום אורחים",
    maxCapacityLabel: "מקסימום אורחים",
    packagesTitle: "חבילות שירות",
    packagesHint: "למשל: תכנון מלא, Day-of coordinator בלבד.",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    catalogTitle: "שירותים כלולים",
    catalogHint: "פגישות תכנון, ליווי ספקים, הושבה.",
    catalogSectionPlaceholder: "למשל: לפני האירוע, ביום האירוע",
    catalogItemPlaceholder: "למשל: פגישת תכנון",
    notesLabel: "הערות",
    notesPlaceholder: "למשל: עד 8 פגישות כלולות",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: false,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "fixed"],
  },
  ceremony: {
    id: "ceremony",
    editorTitle: "חבילות טקס",
    editorHint: "סוג טקס, שפות, נסיעות ומה כלול במחיר.",
    capacityTitle: "היקף",
    capacityHint: "גודל קהל או סוג אירוע.",
    minCapacityLabel: "מינימום משתתפים",
    maxCapacityLabel: "מקסימום משתתפים",
    packagesTitle: "חבילות",
    packagesHint: "למשל: טקס חופה מלא, ייעוץ רישום נישואין.",
    packagePriceLabel: "מחיר (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    catalogTitle: "שירותים נוספים",
    catalogHint: "פגישת היכרות, טקס באנגלית, נסיעה.",
    catalogSectionPlaceholder: "למשל: שירותים",
    catalogItemPlaceholder: "למשל: פגישת היכרות",
    notesLabel: "הערות",
    notesPlaceholder: "למשל: נסיעה עד 40 ק״מ כלולה",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: false,
    requireGuestCountInquiry: false,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "fixed"],
  },
  design: {
    id: "design",
    editorTitle: "עיצוב ופריטי תפאורה",
    editorHint: "פריטי עיצוב, חבילות לפי גודל אירוע ותוספות.",
    capacityTitle: "גודל אירוע",
    capacityHint: "טווח אורחים שהעיצוב מותאם אליו.",
    minCapacityLabel: "מינימום אורחים",
    maxCapacityLabel: "מקסימום אורחים",
    packagesTitle: "חבילות עיצוב",
    packagesHint: "למשל: חופה בסיסית, עיצוב אולם מלא.",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    catalogTitle: "פריטי עיצוב",
    catalogHint: "מרכזי שולחן, קישוט כניסה, פרחים.",
    catalogSectionPlaceholder: "למשל: חופה, שולחנות",
    catalogItemPlaceholder: "למשל: מרכז שולחן גדול",
    notesLabel: "הערות",
    notesPlaceholder: "למשל: פירוק ביום למחרת כלול",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: false,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "fixed", "per_unit"],
  },
  transport: {
    id: "transport",
    editorTitle: "הסעות ותחבורה",
    editorHint: "סוג רכב, קיבולת נוסעים ומחיר לנסיעה / לאורח.",
    capacityTitle: "קיבולת נוסעים",
    capacityHint: "כמה נוסעים בנסיעה או באירוע.",
    minCapacityLabel: "מינימום נוסעים",
    maxCapacityLabel: "מקסימום נוסעים",
    packagesTitle: "חבילות הסעה",
    packagesHint: "למשל: מיניבוס 20 מקומות, לימוזינה זוג.",
    packagePriceLabel: "מחיר לנסיעה / לאורח (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    catalogTitle: "סוגי רכבים",
    catalogHint: "אוטובוס, מיניבוס, רכב יוקרה — עם מחיר.",
    catalogSectionPlaceholder: "למשל: רכבים",
    catalogItemPlaceholder: "למשל: מיניבוס 15 מקומות",
    notesLabel: "הערות",
    notesPlaceholder: "למשל: נסיעות סביב אזור המרכז",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: false,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "fixed", "per_guest"],
  },
  corporate: {
    id: "corporate",
    editorTitle: "חבילות כנס ואירוע עסקי",
    editorHint: "מחיר למשתתף או חבילה מלאה — תוכן, שידור, מיתוג.",
    capacityTitle: "קיבולת משתתפים",
    capacityHint: "מינימום ומקסימום משתתפים בכנס / אירוע.",
    minCapacityLabel: "מינימום משתתפים *",
    maxCapacityLabel: "מקסימום משתתפים *",
    packagesTitle: "חבילות",
    packagesHint: "למשל: כנס היברידי, יום עיון מלא.",
    packagePriceLabel: "מחיר למשתתף (₪)",
    packagePriceExpandLabel: "טווח למשתתף",
    catalogTitle: "שירותים",
    catalogHint: "תרגום, הקלטה, עמדת ספונסר.",
    catalogSectionPlaceholder: "למשל: הפקה, תוכן",
    catalogItemPlaceholder: "למשל: תרגום סימולטני",
    notesLabel: "הערות",
    notesPlaceholder: "למשל: כולל בימה ומערכת הגברה",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: true,
    showPackageDuration: true,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "fixed", "per_guest"],
  },
  generic: {
    id: "generic",
    editorTitle: "חבילות ומחירים",
    editorHint: "הגדירו מה אתם מציעים, חבילות מחיר ופריטים בתוספת תשלום.",
    capacityTitle: "היקף שירות",
    capacityHint: "טווח גודל אירוע / לקוחות שאתם משרתים (אם רלוונטי).",
    minCapacityLabel: "מינימום",
    maxCapacityLabel: "מקסימום",
    packagesTitle: "חבילות",
    packagesHint: "חבילות מוכנות עם מחיר ברור.",
    packagePriceLabel: "מחיר (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    catalogTitle: "פריטים ותוספות",
    catalogHint: "מה כלול ומה בתוספת תשלום.",
    catalogSectionPlaceholder: "קטגוריה",
    catalogItemPlaceholder: "שם פריט",
    notesLabel: "הערות",
    notesPlaceholder: "תנאים מיוחדים",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: false,
    requireGuestCountInquiry: false,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    itemPricingModes: ["included", "fixed", "per_guest", "per_hour", "per_unit"],
  },
};

export const SECONDARY_CATALOG_TEMPLATE = buildSecondaryTemplateMap();

export function getCatalogTemplate(id: CatalogTemplateId): CatalogTemplate {
  return TEMPLATES[id];
}

function lookupTemplateIdForSecondary(secondary: string, primary: string): CatalogTemplateId {
  const normalized = normalizeSecondaryName(secondary);
  return (
    SECONDARY_CATALOG_TEMPLATE[normalized] ??
    PRIMARY_DEFAULT[normalizePrimaryName(primary)] ??
    "generic"
  );
}

export function resolveCatalogTemplateId(
  primary: string,
  secondaries: string[]
): CatalogTemplateId | null {
  const p = normalizePrimaryName(primary.trim());
  if (!p) return null;
  const normalizedSecondaries = secondaries
    .map((s) => normalizeSecondaryName(s.trim()))
    .filter(Boolean);
  if (normalizedSecondaries.length === 1) {
    return lookupTemplateIdForSecondary(normalizedSecondaries[0]!, p);
  }
  if (normalizedSecondaries.length > 1) {
    const ids = new Set(
      normalizedSecondaries.map((s) => lookupTemplateIdForSecondary(s, p))
    );
    if (ids.size === 1) return [...ids][0]!;
    return PRIMARY_DEFAULT[p] ?? "generic";
  }
  return PRIMARY_DEFAULT[p] ?? "generic";
}

export function applySecondaryCatalogHints(
  template: CatalogTemplate,
  secondary: string | null | undefined
): CatalogTemplate {
  const hints = getSecondaryCatalogHints(secondary);
  if (!hints) return template;
  return {
    ...template,
    ...(hints.packagesHint ? { packagesHint: hints.packagesHint } : {}),
    ...(hints.packageNamePlaceholder
      ? { packageNamePlaceholder: hints.packageNamePlaceholder }
      : {}),
    ...(hints.catalogSectionPlaceholder
      ? { catalogSectionPlaceholder: hints.catalogSectionPlaceholder }
      : {}),
    ...(hints.catalogItemPlaceholder
      ? { catalogItemPlaceholder: hints.catalogItemPlaceholder }
      : {}),
    ...(hints.notesPlaceholder ? { notesPlaceholder: hints.notesPlaceholder } : {}),
  };
}

export function resolveCatalogTemplateFromCategory(
  category: string | null | undefined
): CatalogTemplate | null {
  if (!category?.trim()) return null;
  const { primary, secondaries } = parseServiceCategorySelections(category);
  const id = resolveCatalogTemplateId(primary, secondaries);
  if (!id) return null;
  const base = getCatalogTemplate(id);
  const hintSource =
    secondaries.length === 1 ? secondaries[0]! : secondaries[0] ?? null;
  return applySecondaryCatalogHints(base, hintSource);
}

export function resolveStoredCatalogTemplate(
  menu: { templateId?: CatalogTemplateId | null },
  category: string | null | undefined
): CatalogTemplate | null {
  const fromCategory = resolveCatalogTemplateFromCategory(category);
  if (!menu.templateId) return fromCategory;
  const normalized = normalizeCatalogTemplateId(String(menu.templateId));
  if (!normalized) return fromCategory;
  const base = getCatalogTemplate(normalized);
  const { secondaries } = parseServiceCategorySelections(category ?? "");
  return applySecondaryCatalogHints(base, secondaries[0] ?? null);
}

export function serviceUsesCatalogEditor(
  category: string | null | undefined
): boolean {
  return resolveCatalogTemplateFromCategory(category) != null;
}

/** תבניות שבהן עורך הקטלוג מחליף את «מה כלול» / «תוספות» */
const CATALOG_REPLACES_INCLUDES_EDITOR = new Set<CatalogTemplateId>([
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
  "design",
  "transport",
  "corporate",
]);

export function catalogReplacesIncludesEditor(
  templateId: CatalogTemplateId | null | undefined
): boolean {
  return templateId != null && CATALOG_REPLACES_INCLUDES_EDITOR.has(templateId);
}

export { normalizeCatalogTemplateId, PRIMARY_DEFAULT };
