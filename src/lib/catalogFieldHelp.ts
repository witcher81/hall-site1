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
    "זה המחיר הבסיסי לקייטרינג — כמה עולה לאורח אחד. למשל: «תפריט מבוגרים» ₪180 לאורח, «ילדים» ₪80 לאורח. את רשימת המנות רושמים בחלק התחתון «תפריט — מה כלול».",
  catalogSectionTitle: "מה זה «תפריט — מה כלול»?",
  catalogSectionBody:
    "רשימת המנות שאתם מגישים. «כלול» = נכנס במחיר לאורח מלמעלה בלי תוספת. «תוספת לאורח» = מחיר נוסף (למשל סטייק +₪30).",
  minGuests:
    "הכי מעט אורחים שאתם מסכימים להכין לאירוע. מחפש עם פחות — יראה שלא מתאימים.",
  maxGuests:
    "הכי הרבה אורחים שאתם יכולים להכין ולשרת באירוע אחד (צוות, מטבח, לוגיסטיקה).",
  minOrder: "אם יש סכום מינימום להזמנה (למשל ₪8,000) — רשמו כאן. אם אין, השאירו ריק.",
  packageName: "שם סוג המחיר — למשל: «תפריט מבוגרים», «ילדים», «צמחוני».",
  packagePrice:
    "כמה ₪ משלמים לאורח אחד בסוג הזה. דוגמה: 180 = כל אורח מבוגר עולה ₪180.",
  packagePriceRange:
    "אם אין מחיר קבוע — הציגו טווח (למשל ₪150–₪220 לאורח) לפי עונה או סוג אירוע.",
  packageDescription:
    "סיכום קצר מה כלול במחיר — למשל: מנה ראשונה + עיקרית + קינוח, הגשה. הפירוט המלא של המנות בחלק התחתון.",
  sectionTitle: "קבוצת מנות בתפריט — למשל «מנות ראשונות», «עיקריות», «קינוחים».",
  itemName: "שם המנה — למשל: סלט ירוק, אנטריקוט, טירמיסו.",
  itemPricing:
    "«כלול» = במחיר לאורח מלמעלה, בלי תוספת. «תוספת לאורח» = מחיר נוסף לכל אורח שבוחר במנה.",
  itemExtraPrice: "כמה ₪ נוסף לאורח על המנה (רק אם בחרתם «תוספת לאורח»).",
  itemDescription: "פירוט קצר — למשל: כשר, ללא גלוטן, מנה צמחונית.",
  notes: "מידע חשוב למחפש — כשרות, אלרגנים, זמן הגשה, תנאי הזמנה.",
  addPackageButton: "עוד מחיר לאורח — למשל גם «ילדים»",
  addSectionButton: "עוד קבוצת מנות בתפריט",
};

const GENERIC: CatalogFieldHelpSet = {
  packagesSectionTitle: "מה זה «שורת מחיר»?",
  packagesSectionBody:
    "כל שורה = סוג שירות + כמה זה עולה. זה מה שהמחפש רואה בכרטיס שלכם במקום מחיר אחד כללי.",
  catalogSectionTitle: "מה זה «פירוט ותוספות»?",
  catalogSectionBody:
    "פריטים נוספים עם מחיר — מה כלול בלי תשלום ומה בתוספת.",
  minGuests: "המינימום שאתם משרתים / מתאימים אליו.",
  maxGuests: "המקסימום שאתם משרתים / מתאימים אליו.",
  packageName: "שם השירות או הסוג — למשל: «חבילה בסיסית», «שירות מלא».",
  packagePrice: "המחיר העיקרי לשורה הזו.",
  packageDescription: "מה כלול במחיר — המחפש רואה את זה בדף השירות.",
  sectionTitle: "קבוצת פריטים (אופציונלי).",
  itemName: "שם הפריט או התוספת.",
  itemPricing: "האם כלול במחיר או בתוספת תשלום.",
  notes: "הערות, תנאים או מידע חשוב ללקוח.",
  addPackageButton: "הוספת שורת מחיר נוספת",
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
      "מחיר קבוע לבר באירוע — לא לפי אורח. למשל: «בר בסיסי 4 שעות» ₪3,500. את רשימת המשקאות רושמים בחלק התחתון.",
    catalogSectionTitle: "מה זה «רשימת משקאות»?",
    catalogSectionBody:
      "קוקטיילים, יינות, בירות — לכל פריט: כלול במחיר השירות או בתוספת.",
    packageName: "שם החבילה / סוג הבר — למשל: «בר בסיסי 4 שעות».",
    packageDescription:
      "סיכום קצר מה כלול — צוות ברמן, כוסות, קרח. הפירוט של המשקאות למטה.",
    addPackageButton: "עוד חבילת בר",
    addSectionButton: "עוד קבוצת משקאות",
    sectionTitle: "קבוצת משקאות — למשל «קוקטיילים», «יינות».",
    itemName: "שם המשקה — למשל: מוחיטו, קברנה.",
    itemPricing: "«כלול» = במחיר השירות. «מחיר קבוע» / «ליחידה» = תוספת.",
  },
  food_station: {
    ...FIXED_SERVICE,
    packagesSectionBody:
      "מחיר קבוע לעמדת מזון או לעוגה — לא לפי אורח. למשל: «עמדת גלידה 3 שעות» או «עוגה 50 מנות».",
    catalogSectionTitle: "מה זה «טעמים / מנות»?",
    catalogSectionBody: "רשימת טעמים, מנות או מוצרים — כלול במחיר או בתוספת.",
    packageName: "שם החבילה — למשל: «עמדה 3 שעות», «עוגה 50 מנות».",
    addPackageButton: "עוד חבילה",
    sectionTitle: "קבוצת טעמים / מוצרים.",
    itemName: "שם טעם / מנה / מוצר.",
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
      "כל שורה = סוג לקוח + מחיר. למשל: «איפור כלה» ₪2,500, «איפור אורחת» ₪450.",
    minGuests: "הכי מעט אנשים שאתם מטפלים בהם באותו יום אירוע.",
    maxGuests: "הכי הרבה אנשים שאתם יכולים לטפל בהם באותו יום.",
  },
  staffing: {
    ...GENERIC,
    packagesSectionTitle: "מה זה «מחיר צוות»?",
    packagesSectionBody:
      "מלצרים: לרוב מחיר לאורח לפי יחס. ברמן: לשעה. אבטחה/ניקיון/חובש/הקמה: מחיר קבוע לאירוע — הhint של תת־הקטגוריה מכוון.",
    packagePrice: "מחיר לאורח או לשירות — לפי סוג הצוות.",
    packageDuration: "כמה שעות עבודה כלולות בחבילה (למשל 5 שעות).",
    addPackageButton: "עוד חבילת צוות",
  },
  fashion_rental: {
    ...GENERIC,
    packagesSectionTitle: "מה זה «חבילת השכרה / תפירה»?",
    packagesSectionBody:
      "השכרה: מחיר לדגם + ימי השכרה. תפירה: מחיר לתפירה לפי מידות — הhint מחליף את השפה.",
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

export function getCatalogFieldHelp(templateId: CatalogTemplateId): CatalogFieldHelpSet {
  return { ...GENERIC, ...BY_TEMPLATE[templateId] };
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
