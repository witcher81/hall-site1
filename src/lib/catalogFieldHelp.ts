import type { CatalogTemplateId } from "@/lib/serviceCategoryTemplates";

export type CatalogFieldHelpSet = {
  packagesSectionTitle?: string;
  packagesSectionBody?: string;
  catalogSectionTitle?: string;
  catalogSectionBody?: string;
  minGuests?: string;
  maxGuests?: string;
  minOrder?: string;
  packageName?: string;
  packagePrice?: string;
  packagePriceRange?: string;
  packageDescription?: string;
  packageDuration?: string;
  sectionTitle?: string;
  itemName?: string;
  itemPricing?: string;
  itemExtraPrice?: string;
  itemDescription?: string;
  notes?: string;
  addPackageButton?: string;
  addSectionButton?: string;
};

const FOOD: CatalogFieldHelpSet = {
  packagesSectionTitle: "מה זה «מחיר לאורח»?",
  packagesSectionBody:
    "כל תפריט = קבוצה (מבוגרים / ילדים) + מחיר לאורח + המנות שכלולות במחיר. תוספות בתשלום — בנפרד למטה.",
  catalogSectionTitle: "מה זה «תוספות בתשלום»?",
  catalogSectionBody:
    "רק דברים שלא כלולים במחיר התפריט — למשל סטייק בתוספת. המנות הבסיסיות נמצאות בתוך התפריט למעלה.",
  minGuests: "המינימום שלקוחות יכולים להזמין מכם.",
  maxGuests: "המקסימום שאתם יכולים להכין באירוע אחד.",
  minOrder: "סכום מינימום להזמנה — אופציונלי.",
  packageName: "למשל: תפריט מבוגרים / ילדים / צמחוני.",
  packagePrice: "כמה ₪ לאורח אחד בתפריט הזה.",
  packagePriceRange: "אם אין מחיר קבוע — הציגו טווח (למשל 150–220).",
  packageDescription: "אופציונלי — הערות לתפריט (למשל הגשה כלולה).",
  sectionTitle: "קבוצת תוספות — למשל שדרוגים.",
  itemName: "שם המנה / התוספת.",
  itemPricing: "תוספת לאורח או מחיר קבוע.",
  itemExtraPrice: "סכום התוספת.",
  itemDescription: "פרט קצר — כשרות / אלרגנים.",
  notes: "כשרות, אלרגנים, תנאי הזמנה.",
  addPackageButton: "עוד תפריט (למשל ילדים)",
  addSectionButton: "עוד קבוצת תוספות",
};

const GENERIC: CatalogFieldHelpSet = {
  packagesSectionTitle: "מה זה «חבילות ומחירים»?",
  packagesSectionBody:
    "כל חבילה = סוג שירות + כמה זה עולה. זה מה שהמחפש רואה בכרטיס שלכם במקום מחיר אחד כללי.",
  catalogSectionTitle: "מה זה «פירוט ותוספות»?",
  catalogSectionBody:
    "פריטים נוספים עם מחיר — מה כלול בלי תשלום ומה בתוספת.",
  minGuests: "המינימום שאתם משרתים / מתאימים אליו.",
  maxGuests: "המקסימום שאתם משרתים / מתאימים אליו.",
  packageName: "שם השירות או הסוג — למשל: «חבילה בסיסית», «שירות מלא».",
  packagePrice: "המחיר העיקרי לחבילה הזו.",
  packageDescription: "מה כלול במחיר — המחפש רואה את זה בדף השירות.",
  sectionTitle: "קבוצת פריטים (אופציונלי).",
  itemName: "שם הפריט או התוספת.",
  itemPricing: "האם כלול במחיר או בתוספת תשלום.",
  notes: "הערות, תנאים או מידע חשוב ללקוח.",
  addPackageButton: "עוד חבילה",
  addSectionButton: "הוספת קבוצת פריטים",
};

const FIXED_SERVICE: CatalogFieldHelpSet = {
  ...GENERIC,
  packagesSectionTitle: "מה זה «מחיר השירות»?",
  packagesSectionBody:
    "מחיר קבוע לאירוע / לחבילה — לא לפי אורח. רשמו שם ברור + מחיר.",
  packagePrice: "מחיר קבוע לשירות / לערב / ליום.",
  packagePriceRange: "אם אין מחיר קבוע — הציגו טווח לפי גודל או משך.",
  packageDuration: "כמה שעות הפעלה כלולות בחבילה (אם רלוונטי).",
};

const BY_TEMPLATE: Record<CatalogTemplateId, CatalogFieldHelpSet> = {
  food: FOOD,
  beverage: {
    ...FIXED_SERVICE,
    packagesSectionBody:
      "מחיר קבוע לבר באירוע — לא לפי אורח. למשל: «בר בסיסי 4 שעות» ₪3,500. את המשקאות שכלולים רושמים בתוך החבילה («משקאות בחבילה»).",
    catalogSectionTitle: "מה זה «תוספות בתשלום»?",
    catalogSectionBody:
      "רק משקאות או שירותים בתוספת מחיר מעבר לחבילה — למשל בקבוק שמפניה.",
    packageName: "שם החבילה / סוג הבר — למשל: «בר בסיסי 4 שעות».",
    packageDescription:
      "סיכום קצר — צוות ברמן, כוסות, קרח. פירוט המשקאות בתוך החבילה.",
    addPackageButton: "עוד חבילת בר",
    addSectionButton: "עוד קבוצת תוספות",
    sectionTitle: "קבוצת תוספות — למשל «פרימיום».",
    itemName: "שם התוספת — למשל: בקבוק שמפניה.",
    itemPricing: "«מחיר קבוע» / «ליחידה» = תוספת מעבר לחבילה.",
  },
  food_station: {
    ...FIXED_SERVICE,
    packagesSectionTitle: "מה זה «חבילות העמדה»?",
    packagesSectionBody:
      "כל חבילה = שם ברור + מחיר לאירוע + מה כלול במחיר (טעמים / מנות / סוגי מוצר). למשל: «עמדת קרפים 3 שעות».",
    catalogSectionTitle: "מה זה «תוספות בתשלום»?",
    catalogSectionBody:
      "רק דברים בתוספת מחיר מעבר לחבילה — למשל תוספת Nutella. מה שכלול במחיר נרשם בתוך החבילה למעלה.",
    packageName: "שם החבילה — למשל: «עמדת קרפים 3 שעות», «עוגה 50 מנות».",
    packagePrice: "מחיר קבוע לחבילה / לערב.",
    addPackageButton: "עוד חבילה",
    sectionTitle: "קבוצת תוספות בתשלום.",
    itemName: "שם התוספת בתשלום.",
  },
  registration: {
    ...FIXED_SERVICE,
    packagesSectionBody:
      "מחיר קבוע ל-RSVP / הושבה / צ'ק-אין — בדרך כלל לאירוע שלם, לא לאורח.",
    catalogSectionBody: "שירותים כמו מערכת דיגיטלית, כרטיסי שם, צוות בדלת.",
    packageName: "שם החבילה — למשל: «RSVP + הושבה».",
    addPackageButton: "עוד חבילת שירות",
  },
  transport: {
    ...FIXED_SERVICE,
    packagesSectionBody:
      "מחיר לנסיעה או לערב — לא לפי אורח. למשל מיניבוס הלוך-חזור או לימוזינה.",
    packageName: "שם השירות — למשל: «מיניבוס הלוך-חזור».",
    packagePrice: "מחיר לנסיעה / לערב.",
    addPackageButton: "עוד חבילת הסעה",
  },
  corporate: {
    ...FIXED_SERVICE,
    packagesSectionBody:
      "מחיר קבוע ליום / לכנס — שידור, תרגום, מיתוג. לא בהכרח לפי משתתף.",
    packageName: "שם השירות — למשל: «שידור היברידי ליום».",
    addPackageButton: "עוד חבילת שירות",
  },
  beauty: {
    ...GENERIC,
    packagesSectionTitle: "מה זה כאן?",
    packagesSectionBody:
      "כל חבילה = סוג לקוח + מחיר. למשל: «איפור כלה» ₪2,500, «איפור אורחת» ₪450.",
    minGuests: "הכי מעט אנשים שאתם מטפלים בהם באותו יום אירוע.",
    maxGuests: "הכי הרבה אנשים שאתם יכולים לטפל בהם באותו יום.",
  },
  staffing: {
    ...GENERIC,
    packagesSectionTitle: "מה זה «מחיר צוות»?",
    packagesSectionBody:
      "מלצרים: לרוב מחיר לאורח לפי יחס. ברמן: לשעה. אבטחה/ניקיון/חובש/הקמה: מחיר קבוע לאירוע — תת־הקטגוריה מכוונת את השפה.",
    packagePrice: "מחיר לאורח או לשירות — לפי סוג הצוות.",
    packageDuration: "כמה שעות עבודה כלולות בחבילה (למשל 5 שעות).",
    addPackageButton: "עוד חבילת צוות",
  },
  fashion_rental: {
    ...GENERIC,
    packagesSectionTitle: "מה זה «חבילת השכרה / תפירה»?",
    packagesSectionBody:
      "השכרה: מחיר לדגם + ימי השכרה. תפירה: מחיר לתפירה לפי מידות — תת־הקטגוריה מחליפה את השפה.",
    minGuests: "מינימום ימי השכרה או ימי עבודה לתפירה.",
    maxGuests: "מקסימום פריטים במלאי או הזמנות במקביל.",
    packageDuration: "משך השכרה בימים / שעות (אם רלוונטי).",
    notes: "פיקדון, ניקוי, מועד מסירה, מדידות.",
    addPackageButton: "עוד חבילה / דגם",
  },
  print_quantity: {
    ...GENERIC,
    packagesSectionTitle: "מה זה «חבילת עיצוב»?",
    packagesSectionBody:
      "מחיר לעיצוב (חד-פעמי) + מדרגות כמות ליחידה במוצרים למטה.",
    minGuests: "מינימום יחידות בהזמנה.",
    maxGuests: "מקסימום יחידות בהזמנה אחת.",
    packagePrice: "מחיר לעיצוב / לחבילת עיצוב.",
    catalogSectionBody: "סוגי מוצרים עם מחיר ליחידה לפי כמות.",
    addPackageButton: "עוד חבילת עיצוב",
    addSectionButton: "עוד סוג מוצר",
  },
  photo_video: {
    ...GENERIC,
    packagesSectionTitle: "מה זה «חבילת צילום»?",
    packagesSectionBody:
      "שעות כיסוי + תוצרים (תמונות / דקות וידאו) במחיר אחד ברור. תוספות למטה.",
    packageDuration: "כמה שעות כיסוי כלולות בחבילה.",
    catalogSectionBody: "צלם שני, רחפן, אלבום, Same-day — עם מחיר.",
    addPackageButton: "עוד חבילת צילום",
  },
  music: {
    ...GENERIC,
    packagesSectionTitle: "מה זה «חבילת הופעה»?",
    packagesSectionBody:
      "משך הופעה / קטעי אירוע + מחיר. תוספות (שיר, נגן) למטה.",
    packageDuration: "כמה שעות הופעה כלולות.",
    addPackageButton: "עוד חבילת הופעה",
  },
  tech_av: {
    ...GENERIC,
    packagesSectionTitle: "מה זה «חבילה טכנית»?",
    packagesSectionBody:
      "סאונד / תאורה / LED — מחיר לחבילה לפי היקף. ציוד נוסף ושעות למטה.",
    packageDuration: "שעות טכנאי / הפעלה כלולות.",
    notes: "דרישות חשמל, גישה להקמה, נקודת במה.",
    addPackageButton: "עוד חבילה טכנית",
  },
  equipment_rental: {
    ...GENERIC,
    packagesSectionTitle: "מה זה «חבילת ציוד»?",
    packagesSectionBody:
      "סט מוכן (שולחנות+כיסאות) במחיר לחבילה, או פריטים בודדים למטה.",
    minGuests: "מינימום ימי השכרה.",
    maxGuests: "מקסימום פריטים זמינים.",
    packageDuration: "ימי השכרה כלולים בחבילה.",
    notes: "הובלה, הקמה, פירוק, אזור שירות.",
    addPackageButton: "עוד חבילת ציוד",
  },
  attraction: {
    ...GENERIC,
    packagesSectionTitle: "מה זה «חבילת אטרקציה»?",
    packagesSectionBody:
      "משך הפעלה + מחיר קבוע. מתאים גם למגנטים, מראות ויונים.",
    packageDuration: "שעות הפעלה כלולות.",
    notes: "שטח נדרש, חשמל, אישור מקום.",
    addPackageButton: "עוד חבילת אטרקציה",
  },
  planning: {
    ...GENERIC,
    packagesSectionTitle: "מה זה «חבילת ליווי»?",
    packagesSectionBody:
      "תכנון מלא / Day-of — מחיר קבוע לחבילה. פירוט שירותים למטה.",
    addPackageButton: "עוד חבילת ליווי",
  },
  ceremony: {
    ...GENERIC,
    packagesSectionTitle: "מה זה «חבילת טקס»?",
    packagesSectionBody:
      "מחיר קבוע לטקס (רב, עורך טקס, מוהל…). תוספות כמו נסיעה או שפה נוספת למטה.",
    addPackageButton: "עוד חבילת טקס",
  },
  design: {
    ...GENERIC,
    packagesSectionTitle: "מה זה «חבילת עיצוב»?",
    packagesSectionBody:
      "חופה / אולם / קונספט — מחיר לחבילה. פריטים בודדים (מרכזי שולחן) למטה.",
    addPackageButton: "עוד חבילת עיצוב",
  },
  generic: GENERIC,
};

/** עזרה לפי תת־קטגוריה — דריסה מעל עזרת התבנית */
const BY_SECONDARY: Partial<Record<string, Partial<CatalogFieldHelpSet>>> = {
  "הצעות נישואין": {
    packagesSectionTitle: "מה זה «חבילת הצעה»?",
    packagesSectionBody:
      "כל חבילה = הצעת נישואין: שם ברור + מחיר + רשימת מה כלול (לוקיישן, עיצוב, הקמה…). תוספות כמו צלם נסתר — בנפרד למטה.",
    catalogSectionTitle: "מה זה «תוספות בתשלום»?",
    catalogSectionBody:
      "רק שירותים שלא כלולים במחיר החבילה — צילום נסתר, נגן, שמפניה, רחפן וכו'.",
    minGuests: "כמה אנשים מינימום ברגע ההצעה (לרוב הזוג בלבד).",
    maxGuests: "מקסימום אם מזמינים גם משפחה / חברים לסיים את הרגע יחד.",
    packageName: "למשל: הצעה בטבע, חבילה מלאה עם עיצוב וצילום.",
    packagePrice: "מחיר קבוע לחבילת ההצעה (לא לפי אורח).",
    packagePriceRange: "אם המחיר משתנה לפי לוקיישן או היקף — הציגו טווח.",
    packageDescription: "הערות קצרות לחבילה — למשל תיאום סודי עם השותף/ה.",
    packageDuration: "כמה זמן ההקמה / הרגע כלולים בחבילה (אם רלוונטי).",
    sectionTitle: "קבוצת תוספות — למשל צילום, מוזיקה.",
    itemName: "שם התוספת — למשל צלם נסתר.",
    itemPricing: "מחיר קבוע לתוספת (בדרך כלל).",
    notes: "נסיעות, מדיניות ביטול, אישורים ללוקיישן, סודיות.",
    addPackageButton: "עוד חבילת הצעה",
    addSectionButton: "עוד קבוצת תוספות",
  },
};

export function getCatalogFieldHelp(
  templateId: CatalogTemplateId,
  secondary?: string | null
): CatalogFieldHelpSet {
  const base = { ...GENERIC, ...BY_TEMPLATE[templateId] };
  const key = secondary?.trim();
  if (!key) return base;
  const extra = BY_SECONDARY[key];
  return extra ? { ...base, ...extra } : base;
}

export function getItemPricingHelp(
  templateId: CatalogTemplateId,
  pricing: string
): string | undefined {
  if (templateId === "food") {
    if (pricing === "included") return "כלול במחיר לאורח מלמעלה — בלי תוספת.";
    if (pricing === "per_guest") return "מחיר נוסף לכל אורח (למשל סטייק +₪30).";
    if (pricing === "per_guest_range") return "טווח מחיר נוסף לאורח.";
    if (pricing === "fixed") return "מחיר קבוע לאירוע (נדיר — בדרך כלל «תוספת לאורח»).";
  }
  if (templateId === "beverage" || templateId === "food_station") {
    if (pricing === "included") return "כלול במחיר השירות מלמעלה — בלי תוספת.";
    if (pricing === "fixed") return "תוספת במחיר קבוע לאירוע.";
    if (pricing === "per_unit") return "מחיר ליחידה (למשל בקבוק / מנה).";
    if (pricing === "per_guest") return "תוספת לאורח — רק אם באמת גובים כך.";
  }
  if (templateId === "staffing") {
    if (pricing === "included") return "כלול במחיר הצוות מלמעלה.";
    if (pricing === "per_guest") return "תוספת לאורח.";
    if (pricing === "per_hour") return "מחיר לשעת צוות נוספת.";
    if (pricing === "fixed") return "תוספת קבועה לאירוע.";
  }
  return undefined;
}
