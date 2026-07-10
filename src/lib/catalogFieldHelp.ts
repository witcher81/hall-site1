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
  packagesSectionTitle: "מה זה «רמת מחיר»?",
  packagesSectionBody:
    "זו לא חבילת סלולר — אלא דרך להציג למחפש כמה עולה לאורח אחד. לדוגמה: «מנה בסיסית» ב-₪120 לאורח, «פרימיום» ב-₪200 לאורח. המחפש בוחר רמה ומכפיל לפי מספר האורחים.",
  catalogSectionTitle: "מה זה «תפריט מנות»?",
  catalogSectionBody:
    "רשימת מה אתם מגישים — מנות ראשונות, עיקריות, קינוחים. לכל מנה אפשר לציין אם היא כלולה במחיר לאורח או בתוספת תשלום (למשל: סטייק בתוספת ₪30 לאורח).",
  minGuests:
    "הכי מעט אורחים שאתם מסכימים להכין לאירוע. מחפש עם פחות — יראה שלא מתאימים.",
  maxGuests:
    "הכי הרבה אורחים שאתם יכולים להכין ולשרת באירוע אחד (צוות, מטבח, לוגיסטיקה).",
  minOrder: "אם יש סכום מינימום להזמנה (למשל ₪8,000) — רשמו כאן. אם אין, השאירו ריק.",
  packageName: "שם הרמה — למשל: «מנה בסיסית», «כסף», «זהב», «קייטרינג מלא».",
  packagePrice:
    "מחיר לאורח אחד ברמה הזו. דוגמה: 180 = כל אורח משלם ₪180 ברמה «כסף».",
  packagePriceRange:
    "אם אין מחיר קבוע — הציגו טווח (למשל ₪150–₪220 לאורח) לפי עונה או סוג אירוע.",
  packageDescription:
    "מה כוללת הרמה — למשל: 3 מנות + שתייה, הגשה, צוות מלצרים. המחפש רואה את זה בכרטיס.",
  sectionTitle: "שם קבוצת מנות — למשל «מנות ראשונות», «עיקריות», «קינוחים».",
  itemName: "שם המנה — למשל: סלט ירוק, אנטריקוט, טירמיסו.",
  itemPricing:
    "«כלול» = בלי תוספת במחיר לאורח של הרמה. «תוספת לאורח» = מחיר נוסף לכל אורח שבוחר במנה.",
  itemExtraPrice: "כמה ₪ נוסף לאורח על המנה (רק אם בחרתם «תוספת לאורח»).",
  itemDescription: "פירוט קצר — למשל: כשר, ללא גלוטן, מנה צמחונית.",
  notes: "מידע חשוב למחפש — כשרות, אלרגנים, זמן הגשה, תנאי הזמנה.",
  addPackageButton: "עוד רמת מחיר — למשל גם «ילדים» או «VIP»",
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

const BY_TEMPLATE: Partial<Record<CatalogTemplateId, CatalogFieldHelpSet>> = {
  food: FOOD,
  beverage: {
    ...FOOD,
    packagesSectionTitle: "מה זה «רמת בר»?",
    packagesSectionBody:
      "רמות open bar — למשל «בר בסיסי» 80₪ לאורח, «פרימיום» 150₪ לאורח.",
    catalogSectionTitle: "מה זה «רשימת משקאות»?",
    catalogSectionBody:
      "קוקטיילים, יינות, בירות — לכל פריט: כלול ברמה או בתוספת לאורח.",
    sectionTitle: "קבוצת משקאות — למשל «קוקטיילים», «יינות», «ללא אלכוהול».",
    itemName: "שם המשקה — למשל: מוחיטו, קברנה, בירה.",
  },
  food_station: {
    ...GENERIC,
    packagesSectionBody:
      "חבילת עמדה = משך שעות ו/או מחיר קבוע / לאורח — למשל 3 שעות, עד 200 מנות.",
    catalogSectionTitle: "מה זה «טעמים בעמדה»?",
    catalogSectionBody: "רשימת טעמים או מנות — כלול או בתוספת.",
    sectionTitle: "קבוצת טעמים — למשל «גלידה», «תוספות».",
    itemName: "שם טעם / מנה — למשל: וניל, Nutella.",
  },
  registration: {
    ...GENERIC,
    packagesSectionBody:
      "חבילות RSVP, הושבה או צ'ק-אין — מחיר קבוע לאירוע או לאורח.",
    catalogSectionBody: "שירותים כמו מערכת דיגיטלית, כרטיסי שם, צוות בדלת.",
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
    packagesSectionBody:
      "חבילת צוות = כמה עולה לכסות אורחים (למשל מלצרים לפי יחס). לא «חבילת טלפון».",
    packagePrice: "מחיר לאורח — לפי גודל האירוע ויחס מלצרים.",
    packageDuration: "כמה שעות עבודה כלולות בחבילה (למשל 5 שעות).",
  },
};

export function getCatalogFieldHelp(templateId: CatalogTemplateId): CatalogFieldHelpSet {
  return { ...GENERIC, ...BY_TEMPLATE[templateId] };
}

export function getItemPricingHelp(
  templateId: CatalogTemplateId,
  pricing: string
): string | undefined {
  if (templateId === "food" || templateId === "beverage") {
    if (pricing === "included") return "הפריט כלול במחיר לאורח של הרמה — בלי תוספת.";
    if (pricing === "per_guest") return "מחיר נוסף לכל אורח (למשל קוקטייל פרימיום +₪15).";
    if (pricing === "per_guest_range") return "טווח מחיר נוסף לאורח.";
    if (pricing === "fixed") return "מחיר קבוע לאירוע (נדיר — בדרך כלל «לאורח»).";
  }
  return undefined;
}
