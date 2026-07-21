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
  /** רשימת «מה כלול» בתוך שורת מחיר/חבילה */
  showPackageIncludedItems?: boolean;
  packageIncludedTitle?: string;
  packageIncludedHint?: string;
  packageIncludedItemPlaceholder?: string;
  packageIncludedAddLabel?: string;
  /** בלוק תוספות/פירוט מוסתר בהתחלה — רק למי שצריך */
  catalogOptional?: boolean;
  /** רשימת פריטים חלק מרכזי (תפריט / משקאות / דפוס) — לא מקופל */
  catalogEssential?: boolean;
  /** שדה מינימום הזמנה ב₪ (קייטרינג) */
  showMinOrderAmount?: boolean;
  /** שורת שלב במבוא העורך — מחירים */
  packagesStepLabel?: string;
  /** שורת שלב במבוא העורך — קטלוג */
  catalogStepLabel?: string;
  /** תווית שדה שם חבילה */
  packageNameFieldLabel?: string;
  /** תווית שדה תיאור חבילה */
  packageDescriptionFieldLabel?: string;
  /** placeholder לתיאור חבילה */
  packageDescriptionPlaceholder?: string;
  /** placeholder לשם חבילה — מ-SECONDARY_CATALOG_HINTS */
  packageNamePlaceholder?: string;
  /** תווית שדה משך (שעות) */
  packageDurationLabel?: string;
  /** placeholder לשדה משך */
  packageDurationPlaceholder?: string;
  /** תווית כרטיס חבילה — למשל «חבילה» → «חבילה 1» */
  packageCardNoun?: string;
  /** פירוט קצר ליד מספר החבילה */
  packageCardDetail?: string;
  /** כפתור הסרת חבילה */
  packageRemoveLabel?: string;
  itemPricingModes: Array<
    "included" | "per_guest" | "per_guest_range" | "fixed" | "per_unit" | "per_hour"
  >;
};

const TEMPLATES: Record<CatalogTemplateId, CatalogTemplate> = {
  food: {
    id: "food",
    editorTitle: "מחיר ותפריט קייטרינג",
    editorHint: "לכל תפריט: שם + מחיר לאורח + המנות שכלולות. תוספות בתשלום — למטה (אופציונלי).",
    capacityTitle: "קיבולת אורחים",
    capacityHint: "טווח האורחים שאתם יכולים להכין ולשרת באירוע.",
    minCapacityLabel: "מינימום אורחים *",
    maxCapacityLabel: "מקסימום אורחים *",
    packagesTitle: "מחיר לאורח",
    packagesHint: "לכל תפריט (מבוגרים / ילדים…): שם, מחיר לאורח, והמנות שכלולות במחיר.",
    packagePriceLabel: "מחיר לאורח (₪)",
    packagePriceExpandLabel: "אין מחיר קבוע — אציג טווח לאורח",
    packageNamePlaceholder: "למשל: תפריט מבוגרים",
    packagesStepLabel: "מחיר + מנות לכל קבוצה",
    catalogStepLabel: "תוספות בתשלום (אופציונלי)",
    packageNameFieldLabel: "שם התפריט",
    packageDescriptionFieldLabel: "הערות (אופציונלי)",
    packageDescriptionPlaceholder: "למשל: הגשה כלולה",
    packageCardNoun: "תפריט",
    packageCardDetail: "שם, מחיר לאורח ומנות",
    packageRemoveLabel: "הסר תפריט",
    catalogTitle: "תוספות בתשלום",
    catalogHint: "רק מנות או שירותים בתוספת מחיר (לא הכלולים בתפריט למעלה). לדוגמה: סטייק +₪30 לאורח.",
    catalogSectionPlaceholder: "למשל: שדרוגים, שתייה",
    catalogItemPlaceholder: "למשל: סטייק בתוספת",
    notesLabel: "הערות לתפריט (כשרות, אלרגנים)",
    notesPlaceholder: "למשל: כשר למהדרין, אפשרות ללא גלוטן בתיאום",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: false,
    showMinOrderAmount: true,
    catalogOptional: true,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    showPackageIncludedItems: true,
    packageIncludedTitle: "מנות בתפריט הזה",
    packageIncludedHint: "מה כלול במחיר של התפריט הזה.",
    packageIncludedItemPlaceholder: "למשל: סלט ירוק",
    packageIncludedAddLabel: "+ הוסף מנה",
    itemPricingModes: ["included", "per_guest", "per_guest_range", "fixed", "per_unit"],
  },
  beverage: {
    id: "beverage",
    editorTitle: "בר משקאות ומחירים",
    editorHint: "לכל חבילת בר: מחיר השירות + רשימת המשקאות שכלולים. תוספות בתשלום — למטה (אופציונלי).",
    capacityTitle: "קיבולת אורחים",
    capacityHint: "לאיזה גודל אירוע הבר מתאים — לא המחיר עצמו.",
    minCapacityLabel: "מינימום אורחים *",
    maxCapacityLabel: "מקסימום אורחים *",
    packagesTitle: "מחיר השירות",
    packagesHint: "לכל חבילה: שם, מחיר לאירוע (לא לאורח), והמשקאות שכלולים במחיר.",
    packagePriceLabel: "מחיר לשירות (₪)",
    packagePriceExpandLabel: "אין מחיר קבוע — אציג טווח",
    packageNamePlaceholder: "למשל: בר בסיסי 4 שעות, open bar",
    packagesStepLabel: "מחיר + משקאות בחבילה",
    catalogStepLabel: "תוספות בתשלום (אופציונלי)",
    packageNameFieldLabel: "שם החבילה / השירות",
    packageDescriptionFieldLabel: "הערות (אופציונלי)",
    packageDescriptionPlaceholder: "למשל: כולל ברמן וכוסות",
    packageCardNoun: "חבילה",
    packageCardDetail: "שם, מחיר ומשקאות",
    packageRemoveLabel: "הסר חבילה",
    catalogTitle: "תוספות בתשלום",
    catalogHint: "רק משקאות או שירותים בתוספת מחיר מעבר לחבילה.",
    catalogSectionPlaceholder: "למשל: פרימיום, בקבוקים",
    catalogItemPlaceholder: "למשל: בקבוק שמפניה",
    notesLabel: "הערות (כשרות, הגבלות)",
    notesPlaceholder: "למשל: בר כשר, ללא אלכוהול זמין",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: true,
    catalogOptional: true,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    showPackageIncludedItems: true,
    packageIncludedTitle: "משקאות בחבילה",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: מוחיטו",
    packageIncludedAddLabel: "+ הוסף משקה",
    itemPricingModes: ["included", "fixed", "per_unit", "per_guest"],
  },
  food_station: {
    id: "food_station",
    editorTitle: "מחיר העמדה",
    editorHint:
      "בפשטות: מה אתם מוכרים, לכמה שעות, וכמה זה עולה. מתחת — מה כלול במחיר (טעמים / מנות). תוספות בתשלום — בסוף, אופציונלי.",
    capacityTitle: "לכמה אורחים זה מתאים",
    capacityHint: "טווח גודל האירוע שהעמדה מתאימה לו — לא המחיר.",
    minCapacityLabel: "מינימום אורחים *",
    maxCapacityLabel: "מקסימום אורחים *",
    packagesTitle: "מה מוכרים, לכמה זמן, וכמה עולה",
    packagesHint:
      "מלאו שלושה דברים: מה מוכרים · לכמה שעות · מה המחיר. אל תכתבו את השעות בשם — יש שדה נפרד לזה.",
    packagePriceLabel: "מחיר (₪)",
    packagePriceExpandLabel: "אין מחיר קבוע — אציג טווח",
    packageNamePlaceholder: "למשל: עמדת גלידה",
    packagesStepLabel: "מה מוכרים + מחיר + משך",
    catalogStepLabel: "תוספות בתשלום (אופציונלי)",
    packageNameFieldLabel: "מה אתם מוכרים",
    packageDescriptionFieldLabel: "הערות (אופציונלי)",
    packageDescriptionPlaceholder: "למשל: כולל מפעיל וכלים",
    packageDurationLabel: "לכמה זמן (שעות)",
    packageDurationPlaceholder: "למשל: 3",
    packageCardNoun: "אפשרות",
    packageCardDetail: "מה מוכרים, מחיר ומשך",
    packageRemoveLabel: "הסר אפשרות",
    catalogTitle: "תוספות בתשלום",
    catalogHint: "רק דברים בתוספת מחיר — מעבר למה שכלול למעלה.",
    catalogSectionPlaceholder: "למשל: תוספות בתשלום",
    catalogItemPlaceholder: "למשל: תוספת Nutella",
    notesLabel: "הערות (כשרות, אלרגנים)",
    notesPlaceholder: "למשל: חלבי/בשרי, ללא גלוטן בתיאום",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: true,
    catalogOptional: true,
    requireGuestCountInquiry: true,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול במחיר",
    packageIncludedHint: "טעמים / מנות שכלולים במחיר — בלי תוספת תשלום.",
    packageIncludedItemPlaceholder: "למשל: וניל",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    itemPricingModes: ["included", "fixed", "per_unit", "per_guest"],
  },
  registration: {
    id: "registration",
    editorTitle: "רישום, RSVP והושבה",
    editorHint: "לכל שירות: שם + מחיר + מה כלול. תוספות — למטה (אופציונלי).",
    capacityTitle: "קיבולת אורחים",
    capacityHint: "כמה אורחים אתם מלווים — לעזרת התאמה, לא בהכרח לתמחור.",
    minCapacityLabel: "מינימום אורחים *",
    maxCapacityLabel: "מקסימום אורחים *",
    packagesTitle: "מחיר השירות",
    packagesHint: "שם, מחיר לאירוע, ומה כלול בשירות.",
    packagePriceLabel: "מחיר לשירות (₪)",
    packagePriceExpandLabel: "אין מחיר קבוע — אציג טווח",
    packageNamePlaceholder: "למשל: RSVP + הושבה",
    packagesStepLabel: "מחיר + מה כלול בשירות",
    catalogStepLabel: "תוספות בתשלום (אופציונלי)",
    catalogTitle: "תוספות בתשלום",
    catalogHint: "שירותים בתוספת מחיר מעבר לחבילה.",
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
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול בשירות",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: מערכת RSVP",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
    itemPricingModes: ["included", "fixed", "per_guest"],
  },
  staffing: {
    id: "staffing",
    editorTitle: "צוות ותמחור",
    editorHint: "לכל שורת מחיר: שם + מחיר + מה כלול בצוות. תוספות בתשלום — למטה (אופציונלי).",
    capacityTitle: "קיבולת אורחים",
    capacityHint: "לאיזה גודל אירוע אתם מתאימים — משפיע על גודל הצוות.",
    minCapacityLabel: "מינימום אורחים *",
    maxCapacityLabel: "מקסימום אורחים *",
    packagesTitle: "מחיר צוות",
    packagesHint: "שם, מחיר, ומה כלול (מדים, מינימום שעות וכו').",
    packagePriceLabel: "מחיר לאורח (₪)",
    packagePriceExpandLabel: "טווח מחיר לאורח",
    packagesStepLabel: "מחיר + מה כלול בצוות",
    catalogStepLabel: "תוספות בתשלום (אופציונלי)",
    catalogTitle: "תוספות בתשלום",
    catalogHint: "תפקידים או שעות בתוספת מחיר מעבר לחבילה.",
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
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול בצוות",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: מדים, מינימום 4 שעות",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
    itemPricingModes: ["included", "per_guest", "per_hour", "fixed"],
  },
  beauty: {
    id: "beauty",
    editorTitle: "מחירון השירות",
    editorHint: "לכל סוג שירות: שם + מחיר + מה כלול. תוספות בתשלום — למטה (אופציונלי).",
    capacityTitle: "כמה לקוחות ביום אירוע?",
    capacityHint: "מינימום ומקסימום אנשים שאתם יכולים לטפל בהם באותו יום.",
    minCapacityLabel: "מינימום אנשים *",
    maxCapacityLabel: "מקסימום אנשים *",
    packagesTitle: "סוגי שירות ומחירים",
    packagesHint: "חבילה לכל סוג שירות — שם, מחיר, ומה כלול.",
    packagePriceLabel: "מחיר (₪)",
    packagePriceExpandLabel: "אין מחיר קבוע — הציגו טווח",
    packagesStepLabel: "מחיר + מה כלול",
    catalogStepLabel: "תוספות בתשלום (אופציונלי)",
    catalogTitle: "תוספות בתשלום",
    catalogHint: "רק שירותים בתוספת מחיר מעבר לחבילה.",
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
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול בשירות",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: ניסיון איפור",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    itemPricingModes: ["included", "per_unit", "fixed"],
  },
  fashion_rental: {
    id: "fashion_rental",
    editorTitle: "קטלוג השכרה והתאמות",
    editorHint: "לכל חבילה: שם + מחיר + מה כלול. פריטים בתוספת — למטה (אופציונלי).",
    capacityTitle: "מלאי וקיבולת",
    capacityHint: "כמה לקוחות במקביל או כמה פריטים זמינים.",
    minCapacityLabel: "מינימום ימי השכרה",
    maxCapacityLabel: "מקסימום פריטים במלאי",
    packagesTitle: "חבילות השכרה",
    packagesHint: "שם, מחיר, ומה כלול בחבילה (רעלה, התאמות וכו').",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר לחבילה",
    packagesStepLabel: "מחיר + מה כלול בחבילה",
    catalogStepLabel: "פריטים בתוספת (אופציונלי)",
    catalogTitle: "פריטים בתוספת",
    catalogHint: "פריטים בודדים בתוספת מחיר מעבר לחבילה.",
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
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול בחבילה",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: רעלה, התאמות",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
    itemPricingModes: ["included", "fixed", "per_unit"],
  },
  print_quantity: {
    id: "print_quantity",
    editorTitle: "מוצרים ומחיר לפי כמות",
    editorHint: "לכל חבילת עיצוב: מחיר + מה כלול. סוגי מוצרים ומחיר ליחידה — למטה; מדרגות כמות נפרדות.",
    capacityTitle: "טווח כמויות",
    capacityHint: "מינימום ומקסימום יחידות בהזמנה אחת.",
    minCapacityLabel: "מינימום יחידות *",
    maxCapacityLabel: "מקסימום יחידות *",
    packagesTitle: "חבילות עיצוב",
    packagesHint: "שם, מחיר לעיצוב, ומה כלול (סבבי תיקונים וכו').",
    packagePriceLabel: "מחיר לעיצוב (₪)",
    packagePriceExpandLabel: "טווח מחיר לעיצוב",
    packagesStepLabel: "מחיר + מה כלול בעיצוב",
    catalogStepLabel: "סוגי מוצרים (מחיר ליחידה)",
    catalogTitle: "סוגי מוצרים",
    catalogHint: "הזמנה, save the date, תפריט — עם מחיר ליחידה (מדרגות כמות נפרדות).",
    catalogSectionPlaceholder: "למשל: הזמנות, שולחן",
    catalogItemPlaceholder: "למשל: הזמנה כפולה",
    notesLabel: "הערות דפוס",
    notesPlaceholder: "למשל: זמן אספקה 3 שבועות, כולל הדפסה",
    showGuestCapacity: false,
    showPersonCapacity: false,
    showQuantityTiers: true,
    showDeliverables: false,
    showPackageDuration: false,
    catalogEssential: true,
    requireGuestCountInquiry: false,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: true,
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול בעיצוב",
    packageIncludedHint: "מה כלול במחיר העיצוב של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: 2 סבבי תיקונים",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
    itemPricingModes: ["included", "per_unit", "fixed"],
  },
  photo_video: {
    id: "photo_video",
    editorTitle: "חבילות צילום / וידאו",
    editorHint: "לכל חבילה: שם + מחיר + מה כלול. תוספות / תוצרים נוספים — למטה (אופציונלי).",
    capacityTitle: "היקף אירוע",
    capacityHint: "גודל אירוע מומלץ או מקסימום אורחים לכיסוי מלא.",
    minCapacityLabel: "מינימום אורחים (אופציונלי)",
    maxCapacityLabel: "מקסימום אורחים (אופציונלי)",
    packagesTitle: "חבילות שירות",
    packagesHint: "שם, מחיר, ומה כלול (שעות, תמונות, גלריה וכו').",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר לחבילה",
    packagesStepLabel: "מחיר + מה כלול בחבילה",
    catalogStepLabel: "תוספות / תוצרים נוספים (אופציונלי)",
    catalogTitle: "תוספות / תוצרים נוספים",
    catalogHint: "צלם שני, רחפן, אלבום — בתוספת מחיר מעבר לחבילה.",
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
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול בחבילה",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: 400 תמונות, גלריה",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
    itemPricingModes: ["included", "fixed", "per_hour"],
  },
  music: {
    id: "music",
    editorTitle: "חבילות מוזיקה והופעה",
    editorHint: "לכל חבילת הופעה: שם + מחיר + מה כלול. תוספות — למטה (אופציונלי).",
    capacityTitle: "היקף אירוע",
    capacityHint: "גודל אולם / אורחים שההרכב מתאים לו.",
    minCapacityLabel: "מינימום אורחים",
    maxCapacityLabel: "מקסימום אורחים",
    packagesTitle: "חבילות הופעה",
    packagesHint: "שם, מחיר, ומה כלול (הגברה, קבלת פנים וכו').",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    packagesStepLabel: "מחיר + מה כלול בהופעה",
    catalogStepLabel: "תוספות בתשלום (אופציונלי)",
    catalogTitle: "תוספות בתשלום",
    catalogHint: "נגן נוסף, שיר בקשה — בתוספת מחיר מעבר לחבילה.",
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
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול בהופעה",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: הגברה, קבלת פנים",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
    itemPricingModes: ["included", "fixed", "per_hour"],
  },
  tech_av: {
    id: "tech_av",
    editorTitle: "הגברה, תאורה וטכני",
    editorHint: "לכל חבילה: שם + מחיר + מה כלול. ציוד / שעות בתוספת — למטה (אופציונלי).",
    capacityTitle: "היקף טכני",
    capacityHint: "גודל אולם / כמות אורחים שהמערכת מכסה.",
    minCapacityLabel: "מינימום אורחים",
    maxCapacityLabel: "מקסימום אורחים",
    packagesTitle: "חבילות טכניות",
    packagesHint: "שם, מחיר, ומה כלול (טכנאי, ציוד בסיסי וכו').",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    packagesStepLabel: "מחיר + מה כלול בחבילה",
    catalogStepLabel: "ציוד / שעות בתוספת (אופציונלי)",
    catalogTitle: "ציוד / שעות בתוספת",
    catalogHint: "מיקרופון נוסף, שעת טכנאי — בתוספת מחיר מעבר לחבילה.",
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
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול בחבילה",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: טכנאי, ציוד בסיסי",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
    itemPricingModes: ["included", "fixed", "per_hour"],
  },
  equipment_rental: {
    id: "equipment_rental",
    editorTitle: "קטלוג השכרת ציוד",
    editorHint: "לכל חבילה: שם + מחיר + פריטים כלולים. פריטים בודדים בתוספת — למטה (אופציונלי).",
    capacityTitle: "מלאי",
    capacityHint: "כמות פריטים זמינה או גודל אירוע מקסימלי.",
    minCapacityLabel: "מינימום ימי השכרה",
    maxCapacityLabel: "מקסימום פריטים",
    packagesTitle: "חבילות ציוד",
    packagesHint: "שם, מחיר, ופריטים שכלולים בחבילה.",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    packagesStepLabel: "מחיר + פריטים בחבילה",
    catalogStepLabel: "פריטים בודדים בתוספת (אופציונלי)",
    catalogTitle: "פריטים בודדים בתוספת",
    catalogHint: "פריטים בודדים בתוספת מחיר מעבר לחבילה.",
    catalogSectionPlaceholder: "למשל: ריהוט, במה, אוהלים",
    catalogItemPlaceholder: "למשל: שולחן עגול",
    notesLabel: "הובלה והקמה",
    notesPlaceholder: "למשל: הובלה עד 50 ק״מ כלולה",
    showGuestCapacity: true,
    showPersonCapacity: false,
    showQuantityTiers: false,
    showDeliverables: false,
    showPackageDuration: true,
    requireGuestCountInquiry: false,
    requirePersonCountInquiry: false,
    requireQuantityInquiry: false,
    showPackageIncludedItems: true,
    packageIncludedTitle: "פריטים בחבילה",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: 10 שולחנות",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
    itemPricingModes: ["included", "fixed", "per_unit", "per_hour"],
  },
  attraction: {
    id: "attraction",
    editorTitle: "אטרקציה ומחיר",
    editorHint: "לכל חבילה: שם + מחיר + מה כלול באטרקציה. תוספות — למטה (אופציונלי).",
    capacityTitle: "קיבולת קהל",
    capacityHint: "כמה משתתפים בו-זמנית או באירוע.",
    minCapacityLabel: "מינימום משתתפים",
    maxCapacityLabel: "מקסימום משתתפים",
    packagesTitle: "חבילות אטרקציה",
    packagesHint: "שם, מחיר, ומה כלול (מפעיל, אביזרים וכו').",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    packagesStepLabel: "מחיר + מה כלול באטרקציה",
    catalogStepLabel: "תוספות בתשלום (אופציונלי)",
    catalogTitle: "תוספות בתשלום",
    catalogHint: "שעה נוספת, אביזרים — בתוספת מחיר מעבר לחבילה.",
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
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול באטרקציה",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: מפעיל, אביזרים",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
    itemPricingModes: ["included", "fixed", "per_hour"],
  },
  planning: {
    id: "planning",
    editorTitle: "חבילות תכנון וניהול",
    editorHint: "לכל חבילת ליווי: שם + מחיר + מה כלול. שירותים בתוספת — למטה (אופציונלי).",
    capacityTitle: "היקף אירוע",
    capacityHint: "גודל אירוע אופייני שאתם מלווים.",
    minCapacityLabel: "מינימום אורחים",
    maxCapacityLabel: "מקסימום אורחים",
    packagesTitle: "חבילות שירות",
    packagesHint: "שם, מחיר, ומה כלול בליווי (פגישות, יום האירוע וכו').",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    packagesStepLabel: "מחיר + מה כלול בליווי",
    catalogStepLabel: "שירותים בתוספת (אופציונלי)",
    catalogTitle: "שירותים בתוספת",
    catalogHint: "שירותים בתוספת מחיר מעבר לחבילה.",
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
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול בליווי",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: פגישות, יום האירוע",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
    itemPricingModes: ["included", "fixed"],
  },
  ceremony: {
    id: "ceremony",
    editorTitle: "חבילות טקס",
    editorHint: "לכל חבילת טקס: שם + מחיר + מה כלול. שירותים בתוספת — למטה (אופציונלי).",
    capacityTitle: "היקף",
    capacityHint: "גודל קהל או סוג אירוע.",
    minCapacityLabel: "מינימום משתתפים",
    maxCapacityLabel: "מקסימום משתתפים",
    packagesTitle: "חבילות",
    packagesHint: "שם, מחיר, ומה כלול בטקס.",
    packagePriceLabel: "מחיר (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    packagesStepLabel: "מחיר + מה כלול בטקס",
    catalogStepLabel: "שירותים בתוספת (אופציונלי)",
    catalogTitle: "שירותים בתוספת",
    catalogHint: "שירותים בתוספת מחיר מעבר לחבילה.",
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
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול בטקס",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: פגישת היכרות",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
    itemPricingModes: ["included", "fixed"],
  },
  design: {
    id: "design",
    editorTitle: "עיצוב ופריטי תפאורה",
    editorHint: "לכל חבילת עיצוב: שם + מחיר + מה כלול. פריטים בתוספת — למטה (אופציונלי).",
    capacityTitle: "גודל אירוע",
    capacityHint: "טווח אורחים שהעיצוב מותאם אליו.",
    minCapacityLabel: "מינימום אורחים",
    maxCapacityLabel: "מקסימום אורחים",
    packagesTitle: "חבילות עיצוב",
    packagesHint: "שם, מחיר, ומה כלול בעיצוב (חופה, מרכזי שולחן וכו').",
    packagePriceLabel: "מחיר לחבילה (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    packagesStepLabel: "מחיר + מה כלול בעיצוב",
    catalogStepLabel: "פריטים בתוספת (אופציונלי)",
    catalogTitle: "פריטים בתוספת",
    catalogHint: "פריטים בודדים בתוספת מחיר מעבר לחבילה.",
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
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול בעיצוב",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: חופה, מרכזי שולחן",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
    itemPricingModes: ["included", "fixed", "per_unit"],
  },
  transport: {
    id: "transport",
    editorTitle: "הסעות ותחבורה",
    editorHint: "לכל נסיעה/ערב: שם + מחיר + מה כלול. רכבים / תוספות — למטה (אופציונלי).",
    capacityTitle: "קיבולת נוסעים",
    capacityHint: "כמה נוסעים הרכב מכיל.",
    minCapacityLabel: "מינימום נוסעים",
    maxCapacityLabel: "מקסימום נוסעים",
    packagesTitle: "מחיר השירות",
    packagesHint: "שם, מחיר, ומה כלול בנסיעה (נהג, הלוך-חזור וכו').",
    packagePriceLabel: "מחיר לנסיעה / לערב (₪)",
    packagePriceExpandLabel: "אין מחיר קבוע — אציג טווח",
    packageNamePlaceholder: "למשל: מיניבוס הלוך-חזור",
    packagesStepLabel: "מחיר + מה כלול בנסיעה",
    catalogStepLabel: "רכבים / תוספות (אופציונלי)",
    catalogTitle: "רכבים / תוספות",
    catalogHint: "רכבים או תוספות בתוספת מחיר מעבר לחבילה.",
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
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול בנסיעה",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: נהג, הלוך-חזור",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
    itemPricingModes: ["included", "fixed", "per_unit"],
  },
  corporate: {
    id: "corporate",
    editorTitle: "חבילות כנס ואירוע עסקי",
    editorHint: "לכל שירות: שם + מחיר + מה כלול. תוספות — למטה (אופציונלי).",
    capacityTitle: "קיבולת משתתפים",
    capacityHint: "גודל כנס / אירוע שאתם משרתים.",
    minCapacityLabel: "מינימום משתתפים *",
    maxCapacityLabel: "מקסימום משתתפים *",
    packagesTitle: "מחיר השירות",
    packagesHint: "שם, מחיר, ומה כלול בשירות.",
    packagePriceLabel: "מחיר לשירות (₪)",
    packagePriceExpandLabel: "אין מחיר קבוע — אציג טווח",
    packageNamePlaceholder: "למשל: שידור היברידי ליום",
    packagesStepLabel: "מחיר + מה כלול בשירות",
    catalogStepLabel: "תוספות בתשלום (אופציונלי)",
    catalogTitle: "תוספות בתשלום",
    catalogHint: "שירותים בתוספת מחיר מעבר לחבילה.",
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
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול בשירות",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: בימה, הקלטה",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
    itemPricingModes: ["included", "fixed", "per_guest"],
  },
  generic: {
    id: "generic",
    editorTitle: "חבילות ומחירים",
    editorHint: "לכל חבילה: שם + מחיר + מה כלול. תוספות — למטה (אופציונלי).",
    capacityTitle: "היקף שירות",
    capacityHint: "טווח גודל אירוע / לקוחות שאתם משרתים (אם רלוונטי).",
    minCapacityLabel: "מינימום",
    maxCapacityLabel: "מקסימום",
    packagesTitle: "חבילות",
    packagesHint: "שם + מחיר + רשימת מה כלול בחבילה.",
    packagePriceLabel: "מחיר (₪)",
    packagePriceExpandLabel: "טווח מחיר",
    packagesStepLabel: "מחיר + מה כלול בחבילה",
    catalogStepLabel: "תוספות בתשלום (אופציונלי)",
    catalogTitle: "תוספות בתשלום",
    catalogHint: "פריטים בתוספת מחיר מעבר לחבילה.",
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
    showPackageIncludedItems: true,
    packageIncludedTitle: "מה כלול בחבילה",
    packageIncludedHint: "מה כלול במחיר של החבילה הזו.",
    packageIncludedItemPlaceholder: "למשל: פריט כלול",
    packageIncludedAddLabel: "+ הוסף פריט כלול",
    catalogOptional: true,
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
    ...(hints.packagePriceLabel
      ? { packagePriceLabel: hints.packagePriceLabel }
      : {}),
    ...(hints.catalogSectionPlaceholder
      ? { catalogSectionPlaceholder: hints.catalogSectionPlaceholder }
      : {}),
    ...(hints.catalogItemPlaceholder
      ? { catalogItemPlaceholder: hints.catalogItemPlaceholder }
      : {}),
    ...(hints.notesPlaceholder ? { notesPlaceholder: hints.notesPlaceholder } : {}),
    ...(hints.editorTitle ? { editorTitle: hints.editorTitle } : {}),
    ...(hints.editorHint ? { editorHint: hints.editorHint } : {}),
    ...(hints.capacityTitle ? { capacityTitle: hints.capacityTitle } : {}),
    ...(hints.capacityHint ? { capacityHint: hints.capacityHint } : {}),
    ...(hints.minCapacityLabel ? { minCapacityLabel: hints.minCapacityLabel } : {}),
    ...(hints.maxCapacityLabel ? { maxCapacityLabel: hints.maxCapacityLabel } : {}),
    ...(hints.packagesTitle ? { packagesTitle: hints.packagesTitle } : {}),
    ...(hints.packagesStepLabel
      ? { packagesStepLabel: hints.packagesStepLabel }
      : {}),
    ...(hints.catalogStepLabel
      ? { catalogStepLabel: hints.catalogStepLabel }
      : {}),
    ...(hints.catalogTitle ? { catalogTitle: hints.catalogTitle } : {}),
    ...(hints.catalogHint ? { catalogHint: hints.catalogHint } : {}),
    ...(hints.notesLabel ? { notesLabel: hints.notesLabel } : {}),
    ...(hints.packageNameFieldLabel
      ? { packageNameFieldLabel: hints.packageNameFieldLabel }
      : {}),
    ...(hints.packageDescriptionFieldLabel
      ? { packageDescriptionFieldLabel: hints.packageDescriptionFieldLabel }
      : {}),
    ...(hints.packageDescriptionPlaceholder
      ? { packageDescriptionPlaceholder: hints.packageDescriptionPlaceholder }
      : {}),
    ...(hints.packagePriceExpandLabel
      ? { packagePriceExpandLabel: hints.packagePriceExpandLabel }
      : {}),
    ...(hints.packageIncludedTitle
      ? { packageIncludedTitle: hints.packageIncludedTitle }
      : {}),
    ...(hints.packageIncludedHint
      ? { packageIncludedHint: hints.packageIncludedHint }
      : {}),
    ...(hints.packageIncludedItemPlaceholder
      ? {
          packageIncludedItemPlaceholder: hints.packageIncludedItemPlaceholder,
        }
      : {}),
    ...(hints.packageIncludedAddLabel
      ? { packageIncludedAddLabel: hints.packageIncludedAddLabel }
      : {}),
    ...(hints.packageCardNoun ? { packageCardNoun: hints.packageCardNoun } : {}),
    ...(hints.packageCardDetail
      ? { packageCardDetail: hints.packageCardDetail }
      : {}),
    ...(hints.packageRemoveLabel
      ? { packageRemoveLabel: hints.packageRemoveLabel }
      : {}),
    ...(hints.packageDurationLabel
      ? { packageDurationLabel: hints.packageDurationLabel }
      : {}),
    ...(hints.packageDurationPlaceholder
      ? { packageDurationPlaceholder: hints.packageDurationPlaceholder }
      : {}),
    ...(typeof hints.showPackageDuration === "boolean"
      ? { showPackageDuration: hints.showPackageDuration }
      : {}),
    ...(typeof hints.requireGuestCountInquiry === "boolean"
      ? { requireGuestCountInquiry: hints.requireGuestCountInquiry }
      : {}),
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
  "ceremony",
  "design",
  "transport",
  "corporate",
  "generic",
]);

export function catalogReplacesIncludesEditor(
  templateId: CatalogTemplateId | null | undefined
): boolean {
  return templateId != null && CATALOG_REPLACES_INCLUDES_EDITOR.has(templateId);
}

export { normalizeCatalogTemplateId, PRIMARY_DEFAULT };
