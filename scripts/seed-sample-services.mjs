/**
 * יוצר שירותי פרילנסר דוגמה — נתונים מלאים + קבוצות השוואה באותה קטגוריה.
 * הרצה: node scripts/seed-sample-services.mjs
 * בנייה מחדש: node scripts/seed-sample-services.mjs --rebuild
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import {
  SERVICE_SEED_MARKER,
  SEED_UNSPLASH,
  serviceIncludesPayload,
  socialLinks,
  starsToDb,
} from "./seed-lib.mjs";

const prisma = new PrismaClient();

const SEED_MARKER = SERVICE_SEED_MARKER;
const SEED_PASSWORD = "SampleFreelancers2026!";
const FIX_IMAGES = process.argv.includes("--fix-images");
const REBUILD = process.argv.includes("--rebuild");
const CATEGORY_SEP = " / ";

/** תמונות כיסוי מאומתות לפי סוג שירות */
const U = {
  photographer: SEED_UNSPLASH.flowers,
  photographer2: SEED_UNSPLASH.banquet,
  photographer3: SEED_UNSPLASH.weddingTable,
  dj: SEED_UNSPLASH.djParty,
  dj2: SEED_UNSPLASH.dance,
  dj3: SEED_UNSPLASH.djBooth,
  catering: SEED_UNSPLASH.elegantDining,
  flowers: SEED_UNSPLASH.gardenFlowers,
  flowers2: SEED_UNSPLASH.flowers,
  flowers3: SEED_UNSPLASH.chuppah,
  makeup: SEED_UNSPLASH.champagne,
  makeup2: SEED_UNSPLASH.weddingTable,
  makeup3: SEED_UNSPLASH.luxuryInterior,
  planner: SEED_UNSPLASH.weddingHall,
  cocktails: SEED_UNSPLASH.rooftopBar,
  video: SEED_UNSPLASH.modernHall,
  mc: SEED_UNSPLASH.eventSetup,
  cake: SEED_UNSPLASH.cake,
};

function category(primary, secondary) {
  return `${primary}${CATEGORY_SEP}${secondary}`;
}

/** משלים כלולים (חינם) ותוספות בתשלום אם חסרים */
function enrichServiceDefaults(s) {
  const included = Array.isArray(s.included)
    ? s.included
    : (s.customIncludes ?? []).map((label) => ({
        label,
        description: `כלול במחיר — ${label}`,
      }));

  const paidExtras = s.paidExtras ?? [
    {
      label: "שעת עבודה נוספת",
      description: "הארכת זמן באירוע מעבר לחבילה",
      exactPrice: Math.max(300, Math.round((s.minPrice ?? 3000) * 0.1)),
    },
    {
      label: "חבילת שדרוג",
      description: "ציוד/שירות מתקדם לפי צורך",
      usePriceRange: true,
      minPrice: Math.round((s.minPrice ?? 3000) * 0.18),
      maxPrice: Math.round((s.minPrice ?? 3000) * 0.32),
    },
    {
      label: "נסיעה מחוץ לאזור השירות",
      description: "תוספת מרחק לפי מיקום האירוע",
      exactPrice: 400,
    },
  ];

  const descClean = (s.description ?? "").replace(SERVICE_SEED_MARKER, "").trim();

  return {
    ...s,
    included,
    paidExtras,
    shortDescription:
      s.shortDescription ?? (descClean.length > 120 ? `${descClean.slice(0, 117)}…` : descClean),
    galleryImageUrls:
      s.galleryImageUrls ??
      [s.coverImageUrl, s.coverImageUrl2].filter(Boolean).filter(
        (url, i, arr) => url && arr.indexOf(url) === i
      ),
    socialHandle: s.socialHandle ?? `demo.${s.name?.replace(/\s+/g, "").slice(0, 12).toLowerCase()}`,
  };
}

/**
 * קבוצות של 3 שירותים באותה קטגוריה — מחיר, ניסיון וביקורות שונים לבדיקת «הכי משתלם».
 */
const COMPARISON_GROUPS = [
  {
    label: "DJ",
    entries: [
      {
        email: "sample-dj-budget@hallshub.local",
        name: "ניר אשכנזי",
        businessName: "DJ ניר — חבילות זולות",
        businessPhone: "050-1111101",
        service: {
          name: "DJ חבילת בסיס",
          category: category("מוזיקה ובמה", "DJ ותקליטנים"),
          serviceArea: "מרכז בלבד",
          experienceYears: 3,
          languages: "עברית",
          responseTimeHint: "תוך 3 ימים",
          minPrice: 3200,
          maxPrice: 4200,
          includesTravel: false,
          includesEquipment: false,
          includesNote: "הגברה בסיסית ומוזיקה — ללא תאורה.",
          coverImageUrl: U.dj2,
          description: `DJ לחתונות קטנות ואירועים ביתיים. מחיר נוח, ציוד בסיסי. ${SEED_MARKER}`,
          customIncludes: ["מוזיקה מותאמת", "מיקרופון"],
          paidExtras: [
            { label: "תאורת לייזר", description: "מופע תאורה מתקדם", exactPrice: 900 },
            { label: "עשן ואפקטים", description: "מכונת עשן לרחבה", exactPrice: 650 },
          ],
          reviews: [{ stars: 3.5, comment: "סבבה למחיר, ציוד בסיסי." }],
        },
      },
      {
        email: "sample-dj@hallshub.local",
        name: "עומר לוי",
        businessName: "DJ עומר לוי",
        businessPhone: "050-1111002",
        service: {
          name: "DJ ותאורה לאירועים",
          category: category("מוזיקה ובמה", "DJ ותקליטנים"),
          serviceArea: "כל הארץ",
          experienceYears: 9,
          languages: "עברית, אנגלית, רוסית",
          responseTimeHint: "תוך יום עסקים",
          minPrice: 4500,
          maxPrice: 7500,
          includesTravel: true,
          includesEquipment: true,
          includesNote: "מערכת הגברה מקצועית, תאורת רחבה ומיקרופון אלחוטי.",
          coverImageUrl: U.dj,
          description: `הפעלת רחבת ריקודים לחתונות ואירועי חברה. איזון מחיר–איכות מצוין. ${SEED_MARKER}`,
          customIncludes: ["מיקרופון MC", "תאורת מסיבות", "פלייליסט מותאם"],
          reviews: [
            { stars: 4.5, comment: "הרחבה הייתה מלאה כל הלילה." },
            { stars: 5, comment: "מקצועי, מחיר הוגן." },
            { stars: 4.5, comment: "המלצה חמה!" },
            { stars: 5, comment: "תאורה וסאונד מעולים." },
            { stars: 4, comment: "שירות טוב מאוד." },
          ],
        },
      },
      {
        email: "sample-dj-premium@hallshub.local",
        name: "רועי שטרן",
        businessName: "Premium Events DJ",
        businessPhone: "050-1111102",
        service: {
          name: "DJ פרימיום + תאורה מלאה",
          category: category("מוזיקה ובמה", "DJ ותקליטנים"),
          serviceArea: "כל הארץ",
          experienceYears: 16,
          languages: "עברית, אנגלית",
          responseTimeHint: "תוך 24 שעות",
          minPrice: 8500,
          maxPrice: 14000,
          includesTravel: true,
          includesEquipment: true,
          includesNote: "מערכת פרימיום, תאורת במה, עשן ואפקטים.",
          coverImageUrl: U.dj3,
          description: `DJ ותאורה ברמה גבוהה לאירועי יוקרה. יקר יותר אך דירוג גבוה במיוחד. ${SEED_MARKER}`,
          customIncludes: ["תאורת במה", "אפקטי עשן", "טכנאי לייט"],
          reviews: [
            { stars: 5, comment: "הכי טוב שעבדנו איתו." },
            { stars: 5, comment: "שווה כל שקל." },
            { stars: 5, comment: "אירוע ברמה אחרת." },
            { stars: 4.5, comment: "מקצועי מאוד, יקר." },
            { stars: 5, comment: "תאורה מדהימה." },
            { stars: 5, comment: "ממליצים בחום." },
          ],
        },
      },
    ],
  },
  {
    label: "צילום",
    entries: [
      {
        email: "sample-photo-junior@hallshub.local",
        name: "אורי מזרחי",
        businessName: "אורי מזרחי — צילום",
        businessPhone: "050-1111201",
        service: {
          name: "צילום חתונה — צעיר",
          category: category("צילום ותיעוד", "צלם סטילס"),
          serviceArea: "מרכז, שרון",
          experienceYears: 2,
          languages: "עברית",
          responseTimeHint: "תוך 48 שעות",
          minPrice: 4800,
          maxPrice: 6200,
          includesTravel: true,
          includesEquipment: true,
          includesNote: "כיסוי 6 שעות, גלריה דיגיטלית.",
          coverImageUrl: U.photographer2,
          description: `צלם צעיר עם סגנון טבעי. מחיר נמוך יחסית. ${SEED_MARKER}`,
          customIncludes: ["גלריה מקוונת", "6 שעות כיסוי"],
          reviews: [{ stars: 4, comment: "תמונות יפות, עדיין מתחיל." }],
        },
      },
      {
        email: "sample-photo@hallshub.local",
        name: "דניאל כהן",
        businessName: "דניאל כהן — צילום אירועים",
        businessPhone: "050-1111001",
        service: {
          name: "צילום חתונה סטילס",
          category: category("צילום ותיעוד", "צלם סטילס"),
          serviceArea: "מרכז, שרון, שפלה",
          experienceYears: 12,
          languages: "עברית, אנגלית",
          responseTimeHint: "תוך 24 שעות",
          minPrice: 6500,
          maxPrice: 9500,
          includesTravel: true,
          includesEquipment: true,
          includesNote: "כולל עריכה בסיסית, גלריה דיגיטלית ומפגש תכנון.",
          coverImageUrl: U.photographer,
          description: `צילום חתונה אמנותי — הכי משתלם לרוב הזוגות. ${SEED_MARKER}`,
          customIncludes: ["מפגש היכרות", "גלריה מקוונת", "USB עם כל התמונות"],
          reviews: [
            { stars: 5, comment: "תמונות מדהימות!" },
            { stars: 4.5, comment: "מקצועי ונעים." },
            { stars: 5, comment: "שווה את המחיר." },
            { stars: 4.5, comment: "המלצה חמה." },
          ],
        },
      },
      {
        email: "sample-photo-premium@hallshub.local",
        name: "מיה רוזנברג",
        businessName: "Miya Photography",
        businessPhone: "050-1111202",
        service: {
          name: "צילום דוקומנטרי פרימיום",
          category: category("צילום ותיעוד", "צלם סטילס"),
          serviceArea: "כל הארץ",
          experienceYears: 15,
          languages: "עברית, אנגלית, צרפתית",
          responseTimeHint: "תוך 24 שעות",
          minPrice: 11000,
          maxPrice: 16000,
          includesTravel: true,
          includesEquipment: true,
          includesNote: "יום מלא, 2 צלמים, אלבום פרימיום.",
          coverImageUrl: U.photographer3,
          description: `צילום דוקומנטרי בסגנון עיתונאי לאירועי יוקרה. ${SEED_MARKER}`,
          customIncludes: ["2 צלמים", "אלבום מודפס", "עריכה מתקדמת"],
          reviews: [
            { stars: 5, comment: "אמנותית ברמה גבוהה." },
            { stars: 5, comment: "שווה השקעה." },
            { stars: 5, comment: "הכי טוב בתחום." },
            { stars: 5, comment: "מדהים." },
            { stars: 4.5, comment: "יקר אבל מושלם." },
          ],
        },
      },
    ],
  },
  {
    label: "פרחים",
    entries: [
      {
        email: "sample-flowers-budget@hallshub.local",
        name: "יעל כהן",
        businessName: "פרחי יעל",
        businessPhone: "050-1111301",
        service: {
          name: "פרחים פשוטים לחתונה",
          category: category("עיצוב ומיתוג", "עיצוב פרחים"),
          serviceArea: "מרכז, פתח תקווה",
          experienceYears: 4,
          languages: "עברית",
          responseTimeHint: "תוך 5 ימים",
          minPrice: 3800,
          maxPrice: 5500,
          includesTravel: true,
          includesEquipment: false,
          includesNote: "זר כלה, 4 סידורי שולחן, חופה בסיסית.",
          coverImageUrl: U.flowers2,
          description: `עיצוב פרחוני נקי ופשוט — חיסכון משמעותי. ${SEED_MARKER}`,
          customIncludes: ["זר כלה", "חופה בסיסית"],
          reviews: [{ stars: 3.5, comment: "יפה למחיר, פשוט." }],
        },
      },
      {
        email: "sample-flowers@hallshub.local",
        name: "נועה שפירא",
        businessName: "פרחי נועה",
        businessPhone: "050-1111004",
        service: {
          name: "עיצוב פרחים לחתונה",
          category: category("עיצוב ומיתוג", "עיצוב פרחים"),
          serviceArea: "גוש דן, השרון",
          experienceYears: 8,
          languages: "עברית, אנגלית",
          responseTimeHint: "תוך 3 ימים",
          minPrice: 5500,
          maxPrice: 12000,
          includesTravel: true,
          includesEquipment: false,
          includesNote: "חופה, זר כלה, סידורי שולחן — לפי חבילה.",
          coverImageUrl: U.flowers,
          description: `עיצוב פרחוני רומנטי — איזון מחיר ואיכות. ${SEED_MARKER}`,
          customIncludes: ["זר כלה", "סידור חופה", "2 סידורי שולחן VIP"],
          reviews: [
            { stars: 4.5, comment: "החופה הייתה מושלמת." },
            { stars: 5, comment: "מקצועית ויצירתית." },
            { stars: 4.5, comment: "ממליצים." },
          ],
        },
      },
      {
        email: "sample-flowers-premium@hallshub.local",
        name: "אביגיל לוי",
        businessName: "Avigail Luxury Flowers",
        businessPhone: "050-1111302",
        service: {
          name: "עיצוב פרחים יוקרתי",
          category: category("עיצוב ומיתוג", "עיצוב פרחים"),
          serviceArea: "כל הארץ",
          experienceYears: 14,
          languages: "עברית, אנגלית",
          responseTimeHint: "תוך 48 שעות",
          minPrice: 10500,
          maxPrice: 22000,
          includesTravel: true,
          includesEquipment: false,
          includesNote: "קונספט מלא, פרחים מיובאים, קיר פרחים.",
          coverImageUrl: U.flowers3,
          description: `עיצוב פרחוני יוקרתי לאירועי פרימיום. ${SEED_MARKER}`,
          customIncludes: ["קיר פרחים", "חופה מורכבת", "סידורי VIP"],
          reviews: [
            { stars: 5, comment: "ברמה בינלאומית." },
            { stars: 5, comment: "הכי יפה שראינו." },
            { stars: 5, comment: "שווה כל שקל." },
            { stars: 5, comment: "מדהים." },
          ],
        },
      },
    ],
  },
  {
    label: "איפור",
    entries: [
      {
        email: "sample-makeup-budget@hallshub.local",
        name: "טל אברהם",
        businessName: "איפור טל",
        businessPhone: "050-1111401",
        service: {
          name: "איפור כלה — כניסה",
          category: category("יופי ואיפור", "איפור ושיער — חבילת כלה"),
          serviceArea: "מרכז",
          experienceYears: 2,
          languages: "עברית",
          responseTimeHint: "תוך 3 ימים",
          minPrice: 2200,
          maxPrice: 2800,
          includesTravel: false,
          includesEquipment: true,
          includesNote: "איפור בלבד, ללא שיער.",
          coverImageUrl: U.makeup2,
          description: `איפור כלה במחיר נוח — מתאים לתקציב מצומצם. ${SEED_MARKER}`,
          customIncludes: ["ניסיון איפור", "ריסים"],
          reviews: [{ stars: 3.5, comment: "סבבה למחיר." }],
        },
      },
      {
        email: "sample-makeup@hallshub.local",
        name: "שירה גולן",
        businessName: "שירה גולן — איפור כלות",
        businessPhone: "050-1111005",
        service: {
          name: "איפור ושיער לכלה",
          category: category("יופי ואיפור", "איפור ושיער — חבילת כלה"),
          serviceArea: "מרכז, שרון",
          experienceYears: 10,
          languages: "עברית, אנגלית",
          responseTimeHint: "תוך 24 שעות",
          minPrice: 2800,
          maxPrice: 4200,
          includesTravel: true,
          includesEquipment: true,
          includesNote: "כולל ניסיון, ליווי ביום האירוע ותיקונים.",
          coverImageUrl: U.makeup,
          description: `לוק כלה עמיד — הכי משתלם ברוב המקרים. ${SEED_MARKER}`,
          customIncludes: ["ניסיון איפור", "ריסים", "ליווי עד היציאה"],
          reviews: [
            { stars: 5, comment: "הכלה נראתה מדהים!" },
            { stars: 4.5, comment: "עמיד כל היום." },
            { stars: 5, comment: "מקצועית." },
            { stars: 4.5, comment: "ממליצה בחום." },
          ],
        },
      },
      {
        email: "sample-makeup-premium@hallshub.local",
        name: "ליאת בר",
        businessName: "Liat Bar Bridal",
        businessPhone: "050-1111402",
        service: {
          name: "סטיילינג כלה VIP",
          category: category("יופי ואיפור", "איפור ושיער — חבילת כלה"),
          serviceArea: "כל הארץ",
          experienceYears: 18,
          languages: "עברית, אנגלית, רוסית",
          responseTimeHint: "תוך 24 שעות",
          minPrice: 5200,
          maxPrice: 7500,
          includesTravel: true,
          includesEquipment: true,
          includesNote: "איפור + שיער + ליווי + אם כלה.",
          coverImageUrl: U.makeup3,
          description: `סטיילינג כלה ברמת יוקרה — דירוג גבוה, מחיר גבוה. ${SEED_MARKER}`,
          customIncludes: ["אם כלה", "תיקונים", "מוצרי פרימיום"],
          reviews: [
            { stars: 5, comment: "הכי טובה בתחום." },
            { stars: 5, comment: "שווה השקעה." },
            { stars: 5, comment: "מושלמת." },
            { stars: 5, comment: "יוקרתי ומקצועי." },
          ],
        },
      },
    ],
  },
];

/** שירותים בודדים (ללא קבוצת השוואה) */
const STANDALONE_ENTRIES = [
  {
    email: "sample-catering@hallshub.local",
    name: "מיכל אברהם",
    businessName: "קייטרינג מיכל",
    businessPhone: "050-1111003",
    service: {
      name: "קייטרינג כשר למהדרין",
      category: category("אוכל ומשקאות", "קייטרינג כשר למהדרין"),
      serviceArea: "מרכז, ירושלים, שפלה",
      experienceYears: 15,
      languages: "עברית",
      responseTimeHint: "תוך 48 שעות",
      minPrice: 180,
      maxPrice: 280,
      includesTravel: true,
      includesEquipment: true,
      includesNote: "מחיר למנה — כולל הגשה וצוות.",
      coverImageUrl: U.catering,
      description: `תפריט עשיר לחתונות. מטבח כשר למהדרין. ${SEED_MARKER}`,
      customIncludes: ["תפריט טעימות", "תפריט ילדים", "עמדת סלטים"],
      reviews: [],
    },
  },
  {
    email: "sample-planner@hallshub.local",
    name: "רונית ברק",
    businessName: "RB Event Planning",
    businessPhone: "050-1111006",
    service: {
      name: "תכנון וניהול חתונה",
      category: category("תכנון וניהול אירוע", "מתכנן/ת חתונה (Wedding planner)"),
      serviceArea: "כל הארץ",
      experienceYears: 14,
      languages: "עברית, אנגלית",
      responseTimeHint: "תוך יום עסקים",
      minPrice: 8000,
      maxPrice: 18000,
      includesTravel: true,
      includesEquipment: false,
      includesNote: "ליווי מלא מתכנון ועד יום האירוע.",
      coverImageUrl: U.planner,
      description: `תכנון חתונה מקצה לקצה. ${SEED_MARKER}`,
      customIncludes: ["פגישות תכנון", "לו״ז מפורט", "ניהול יום האירוע"],
      reviews: [],
    },
  },
  {
    email: "sample-bar@hallshub.local",
    name: "איתי מזרחי",
    businessName: "בר קוקטיילים — איתי",
    businessPhone: "050-1111007",
    service: {
      name: "בר קוקטיילים ומיקסולוגיה",
      category: category("אוכל ומשקאות", "בר קוקטיילים / מיקסולוגיה"),
      serviceArea: "מרכז, שרון, חיפה",
      experienceYears: 7,
      languages: "עברית, אנגלית",
      responseTimeHint: "תוך 48 שעות",
      minPrice: 6000,
      maxPrice: 11000,
      includesTravel: true,
      includesEquipment: true,
      includesNote: "בר מלא, ברמן מקצועי, אלכוהול.",
      coverImageUrl: U.cocktails,
      description: `בר קוקטיילים מעוצב לחתונות. ${SEED_MARKER}`,
      customIncludes: ["3 קוקטיילים ייחודיים", "ברמן", "עמדת בר מעוצבת"],
      reviews: [],
    },
  },
  {
    email: "sample-video@hallshub.local",
    name: "יואב נחום",
    businessName: "יואב נחום — וידאו",
    businessPhone: "050-1111008",
    service: {
      name: "צילום וידאו וקליפ חתונה",
      category: category("צילום ותיעוד", "קליפ חתונה / Same-day edit"),
      serviceArea: "מרכז, ירושלים, דרום",
      experienceYears: 11,
      languages: "עברית, אנגלית",
      responseTimeHint: "תוך 24 שעות",
      minPrice: 7500,
      maxPrice: 14000,
      includesTravel: true,
      includesEquipment: true,
      includesNote: "צילום 4K, עריכת קליפ וסרט מלא.",
      coverImageUrl: U.video,
      description: `סיפור ויזואלי של יום החתונה. ${SEED_MARKER}`,
      customIncludes: ["קליפ 3–5 דקות", "צילום טקס", "מוזיקה מורשית"],
      reviews: [],
    },
  },
  {
    email: "sample-mc@hallshub.local",
    name: "אלון דביר",
    businessName: "אלון דביר — MC",
    businessPhone: "050-1111009",
    service: {
      name: "יליצן ו-MC לחתונה",
      category: category("מוזיקה ובמה", "יליצן / MC לאירוע"),
      serviceArea: "כל הארץ",
      experienceYears: 13,
      languages: "עברית, אנגלית",
      responseTimeHint: "תוך יום עסקים",
      minPrice: 3500,
      maxPrice: 6000,
      includesTravel: true,
      includesEquipment: false,
      includesNote: "הנחיית טקס ורחבת ריקודים.",
      coverImageUrl: U.mc,
      description: `MC מנוסה לחתונות. ${SEED_MARKER}`,
      customIncludes: ["פגישת תיאום", "הנחיית טקס", "משחקי קהל"],
      reviews: [],
    },
  },
  {
    email: "sample-cake@hallshub.local",
    name: "ליאת פרידמן",
    businessName: "עוגות ליאת",
    businessPhone: "050-1111010",
    service: {
      name: "עוגות מעוצבות לאירועים",
      category: category("אוכל ומשקאות", "עוגות לאירועים"),
      serviceArea: "מרכז, שרון, ירושלים",
      experienceYears: 9,
      languages: "עברית",
      responseTimeHint: "תוך 3 ימים",
      minPrice: 1200,
      maxPrice: 4500,
      includesTravel: true,
      includesEquipment: false,
      includesNote: "עוגה מעוצבת, טעימה ומשלוח.",
      coverImageUrl: U.cake,
      description: `עוגות חתונה בעיצוב אישי. ${SEED_MARKER}`,
      customIncludes: ["פגישת טעימות", "עיצוב אישי", "משלוח לאולם"],
      reviews: [],
    },
  },
];

const ALL_ENTRIES = [
  ...COMPARISON_GROUPS.flatMap((g) => g.entries),
  ...STANDALONE_ENTRIES,
];

async function wipeSeedServices() {
  const services = await prisma.service.findMany({
    where: { description: { contains: SEED_MARKER } },
    select: { id: true },
  });
  const ids = services.map((s) => s.id);
  if (ids.length === 0) return 0;
  await prisma.serviceRequest.deleteMany({ where: { serviceId: { in: ids } } });
  await prisma.serviceFavorite.deleteMany({ where: { serviceId: { in: ids } } });
  const r = await prisma.service.deleteMany({ where: { id: { in: ids } } });
  return r.count;
}

async function getOrCreateFreelancer(entry) {
  let user = await prisma.user.findUnique({ where: { email: entry.email } });
  if (!user) {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
    user = await prisma.user.create({
      data: {
        email: entry.email,
        name: entry.name,
        passwordHash,
        role: "FREELANCER",
        emailVerified: true,
        businessName: entry.businessName,
        businessPhone: entry.businessPhone,
      },
    });
    console.log("נוצר פרילנסר:", user.email);
  } else if (user.role !== "FREELANCER") {
    throw new Error(`המשתמש ${entry.email} קיים אך אינו FREELANCER`);
  }
  return user;
}

const reviewerCache = new Map();

async function getReviewer(index) {
  if (reviewerCache.has(index)) return reviewerCache.get(index);
  const email = `sample-reviewer-${index}@hallshub.local`;
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
    user = await prisma.user.create({
      data: {
        email,
        name: `מבקר דוגמה ${index}`,
        passwordHash,
        role: "SEEKER",
        emailVerified: true,
      },
    });
  }
  reviewerCache.set(index, user);
  return user;
}

async function seedReviews(serviceId, reviews) {
  if (!reviews?.length) return;
  let reviewerIndex = 1;
  for (const rev of reviews) {
    const reviewer = await getReviewer(reviewerIndex);
    reviewerIndex += 1;
    const existing = await prisma.serviceReview.findUnique({
      where: { userId_serviceId: { userId: reviewer.id, serviceId } },
    });
    if (existing) continue;
    await prisma.serviceReview.create({
      data: {
        serviceId,
        userId: reviewer.id,
        rating: starsToDb(rev.stars),
        comment: rev.comment ?? null,
      },
    });
  }
}

async function main() {
  if (FIX_IMAGES) {
    let fixed = 0;
    for (const entry of ALL_ENTRIES) {
      const s = enrichServiceDefaults(entry.service);
      const result = await prisma.service.updateMany({
        where: { name: s.name, description: { contains: SEED_MARKER } },
        data: {
          coverImageUrl: s.coverImageUrl,
          galleryImageUrls:
            s.galleryImageUrls.length > 0 ? JSON.stringify(s.galleryImageUrls) : null,
        },
      });
      if (result.count > 0) {
        fixed += 1;
        console.log(`✓ תמונות: ${s.name}`);
      }
    }
    console.log(`\nסיום: עודכנו ${fixed} שירותים.`);
    return;
  }

  if (REBUILD) {
    const wiped = await wipeSeedServices();
    console.log(`נמחקו ${wiped} שירותי דוגמה קיימים.`);
  }

  let created = 0;
  let updated = 0;

  for (const entry of ALL_ENTRIES) {
    const s = enrichServiceDefaults(entry.service);

    const dup = await prisma.service.findFirst({
      where: { name: s.name, description: { contains: SEED_MARKER } },
    });

    const provider = await getOrCreateFreelancer(entry);
    const payload = {
      name: s.name,
      category: s.category,
      shortDescription: s.shortDescription,
      description: s.description,
      serviceArea: s.serviceArea,
      experienceYears: s.experienceYears,
      languages: s.languages,
      responseTimeHint: s.responseTimeHint,
      includesTravel: s.includesTravel,
      includesEquipment: s.includesEquipment,
      includesNote: s.includesNote,
      customIncludesJson: serviceIncludesPayload(s.included, s.paidExtras),
      socialLinksJson: socialLinks(s.socialHandle),
      coverImageUrl: s.coverImageUrl,
      galleryImageUrls:
        s.galleryImageUrls.length > 0 ? JSON.stringify(s.galleryImageUrls) : null,
      minPrice: s.minPrice,
      maxPrice: s.maxPrice,
    };

    if (dup && !REBUILD) {
      await prisma.service.update({ where: { id: dup.id }, data: payload });
      await seedReviews(dup.id, s.reviews);
      updated += 1;
      console.log(`↻ עודכן: ${s.name} (id ${dup.id})`);
      continue;
    }
    if (dup) continue;

    const service = await prisma.service.create({
      data: { providerId: provider.id, ...payload },
    });
    await seedReviews(service.id, s.reviews);
    created += 1;
    console.log(`+ ${service.name} (id ${service.id}) — ${provider.businessName}`);
  }

  const total = await prisma.service.count({
    where: { description: { contains: SEED_MARKER } },
  });

  console.log(`\nסיום: נוצרו ${created}, עודכנו ${updated}. סה"כ דוגמה: ${total}`);
  console.log("\nקבוצות השוואה (3 בכל קטגוריה):");
  for (const g of COMPARISON_GROUPS) {
    console.log(`  • ${g.label}: ${g.entries.map((e) => e.service.name).join(" | ")}`);
  }
  console.log(`\nהתחברות לדוגמה: sample-dj@hallshub.local / ${SEED_PASSWORD}`);
  console.log("בדיקת חלופות: אשף הזמנה לאולם → שלב שירותים → תוספת DJ/צילום/פרחים/איפור");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
