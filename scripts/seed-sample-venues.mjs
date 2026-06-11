/**
 * יוצר 10 אולמות דוגמה עם שמות, נתונים ותמונות ציבוריות (Unsplash).
 * הרצה: node scripts/seed-sample-venues.mjs
 * תיקון תמונות קיימות: node scripts/seed-sample-venues.mjs --fix-images
 * אידמפוטנטי — מדלג אם כבר קיימים 10+ אולמות לבעל הדוגמה.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SEED_OWNER_EMAIL = "sample-venues@hallshub.local";
const SEED_MARKER = "[seed-sample-venues]";
const FIX_IMAGES = process.argv.includes("--fix-images");

/** מזהי Unsplash מאומתים — פורמט auto=format אמין יותר מ-?w= בלבד */
function unsplash(photoId) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=80`;
}

const U = {
  weddingHall: unsplash("1464366400600-7168b8af9bc3"),
  weddingTable: unsplash("1519741497674-611481863552"),
  eventSetup: unsplash("1511795409834-ef04bbd61622"),
  flowers: unsplash("1511285560929-80b456fea0bc"),
  rooftopBar: unsplash("1514933651103-005eec06c04b"),
  djParty: unsplash("1470225620780-dba8ba36b745"),
  mountainView: unsplash("1506905925346-21bda4d32df4"),
  restaurant: unsplash("1414235077428-338989a2e8c0"),
  elegantDining: unsplash("1551218808-94e220e084d2"),
  outdoorGarden: unsplash("1559339352-11d035aa65de"),
  resortPool: unsplash("1566073771259-6a8506099945"),
  venueLights: unsplash("1571896349842-33c89424de2d"),
  modernHall: unsplash("1600596542815-ffad4c1539a9"),
  luxuryInterior: unsplash("1600585154340-be6161a56a0c"),
  glassHall: unsplash("1600607687939-ce8a6c25118c"),
  chuppah: unsplash("1520854221256-17451cc331bf"),
  banquet: unsplash("1606216794074-735e91aa2c92"),
  cake: unsplash("1583939003579-730e3918a45a"),
  dance: unsplash("1537633552985-df8429e8048b"),
  champagne: unsplash("1478146896981-b80fe463b330"),
};

const VENUES = [
  {
    name: "אולם אגדות תל אביב",
    city: "תל אביב",
    address: "הרצל 142",
    venueType: "אולם",
    minGuests: 150,
    maxGuests: 450,
    minPrice: 280,
    maxPrice: 420,
    hallRentalMin: 35000,
    hallRentalMax: 65000,
    kashrut: "מהדרין",
    parkingKind: "adjacent",
    latitude: 32.0644,
    longitude: 34.7749,
    seaView: false,
    boutique: false,
    accessible: true,
    hasChuppa: true,
    hasFood: true,
    hasDanceFloor: true,
    hasTableSetup: true,
    hasSoundSystem: true,
    hasBridalRoom: true,
    coverImageUrl: U.weddingHall,
    galleryImageUrls: [U.weddingTable, U.eventSetup, U.elegantDining],
    description:
      "אולם מרכזי בתל אביב לאירועי חתונה ובר/בת מצווה. עיצוב אלגנטי, מטבח כשר מהדרין, רחבת ריקודים מרווחת וחופה מקורה.",
    eventTypes: ["חתונה", "בר מצווה", "בת מצווה", "אירוע עסקי"],
  },
  {
    name: "גן אירועים הדס הרצליה",
    city: "הרצליה",
    address: "המדע 8",
    venueType: "גן",
    minGuests: 80,
    maxGuests: 280,
    minPrice: 320,
    maxPrice: 480,
    hallRentalMin: 28000,
    hallRentalMax: 52000,
    kashrut: "רגיל",
    parkingKind: "nearby",
    latitude: 32.1616,
    longitude: 34.8443,
    seaView: true,
    boutique: true,
    accessible: true,
    hasChuppa: true,
    hasFood: true,
    hasDanceFloor: true,
    hasTableSetup: true,
    hasSoundSystem: true,
    hasBridalRoom: true,
    coverImageUrl: U.outdoorGarden,
    galleryImageUrls: [U.flowers, U.resortPool],
    description:
      "גן אירועים ירוק בהרצליה פיתוח, עם אווירה אינטימית ונוף פתוח. מתאים לחתונות בוטיק ואירועי קיץ.",
    eventTypes: ["חתונה", "ברית", "יום הולדת"],
  },
  {
    name: "רופטופ 360 תל אביב",
    city: "תל אביב",
    address: "רוטשילד 45",
    venueType: "רופטופ",
    minGuests: 60,
    maxGuests: 180,
    minPrice: 350,
    maxPrice: 520,
    hallRentalMin: 22000,
    hallRentalMax: 42000,
    kashrut: "ללא",
    parkingKind: "nearby",
    latitude: 32.0638,
    longitude: 34.7712,
    seaView: true,
    boutique: true,
    accessible: false,
    hasChuppa: false,
    hasFood: true,
    hasDanceFloor: true,
    hasTableSetup: true,
    hasSoundSystem: true,
    hasBridalRoom: false,
    coverImageUrl: U.rooftopBar,
    galleryImageUrls: [U.djParty, U.mountainView],
    description:
      "אירועים על גג עם נוף פנורמי לעיר. אידיאלי לחתונות ערב, קוקטיילים ואירועי השקה.",
    eventTypes: ["חתונה", "אירוע עסקי", "יום הולדת"],
  },
  {
    name: "אולם רויאל ירושלים",
    city: "ירושלים",
    address: "יפו 216",
    venueType: "אולם",
    minGuests: 200,
    maxGuests: 550,
    minPrice: 260,
    maxPrice: 390,
    hallRentalMin: 40000,
    hallRentalMax: 75000,
    kashrut: "מהדרין",
    parkingKind: "adjacent",
    latitude: 31.7857,
    longitude: 35.2007,
    seaView: false,
    boutique: false,
    accessible: true,
    hasChuppa: true,
    hasFood: true,
    hasDanceFloor: true,
    hasTableSetup: true,
    hasSoundSystem: true,
    hasBridalRoom: true,
    coverImageUrl: U.modernHall,
    galleryImageUrls: [U.weddingHall, U.banquet],
    description:
      "אולם מפואר בירושלים לאירועים גדולים. כשרות מהדרין, חניה צמודה וצוות הפקה מנוסה.",
    eventTypes: ["חתונה", "בר מצווה", "בת מצווה", "חינה"],
  },
  {
    name: "גן ואולם נווה קיסר חיפה",
    city: "חיפה",
    address: "שדרות הנשיא 120",
    venueType: "גן ואולם",
    minGuests: 120,
    maxGuests: 400,
    minPrice: 240,
    maxPrice: 360,
    hallRentalMin: 30000,
    hallRentalMax: 58000,
    kashrut: "רגיל",
    parkingKind: "adjacent",
    latitude: 32.794,
    longitude: 34.9896,
    seaView: true,
    boutique: false,
    accessible: true,
    hasChuppa: true,
    hasFood: true,
    hasDanceFloor: true,
    hasTableSetup: true,
    hasSoundSystem: true,
    hasBridalRoom: true,
    coverImageUrl: U.resortPool,
    galleryImageUrls: [U.outdoorGarden, U.weddingHall],
    description:
      "שילוב גן פתוח ואולם מקורה עם נוף לים ולכרמל. מתאים לחתונות קיץ וחורף.",
    eventTypes: ["חתונה", "בר מצווה", "ברית"],
  },
  {
    name: "אולם דיאמונד פתח תקווה",
    city: "פתח תקווה",
    address: "ז'בוטינסקי 12",
    venueType: "אולם",
    minGuests: 180,
    maxGuests: 500,
    minPrice: 220,
    maxPrice: 340,
    hallRentalMin: 32000,
    hallRentalMax: 60000,
    kashrut: "מהדרין",
    parkingKind: "adjacent",
    latitude: 32.084,
    longitude: 34.8878,
    seaView: false,
    boutique: false,
    accessible: true,
    hasChuppa: true,
    hasFood: true,
    hasDanceFloor: true,
    hasTableSetup: true,
    hasSoundSystem: true,
    hasBridalRoom: true,
    coverImageUrl: U.luxuryInterior,
    galleryImageUrls: [U.banquet],
    description:
      "אולם מרכזי במרכז הארץ, נגיש מתל אביב והשרון. מטבח עשיר ואולם מואר לריקודים.",
    eventTypes: ["חתונה", "בר מצווה", "בת מצווה", "כנס"],
  },
  {
    name: "גן אירועים כרמל נתניה",
    city: "נתניה",
    address: "הרצל 88",
    venueType: "גן",
    minGuests: 100,
    maxGuests: 320,
    minPrice: 270,
    maxPrice: 410,
    hallRentalMin: 26000,
    hallRentalMax: 48000,
    kashrut: "רגיל",
    parkingKind: "nearby",
    latitude: 32.3215,
    longitude: 34.8532,
    seaView: true,
    boutique: true,
    accessible: true,
    hasChuppa: true,
    hasFood: true,
    hasDanceFloor: true,
    hasTableSetup: true,
    hasSoundSystem: true,
    hasBridalRoom: false,
    coverImageUrl: U.flowers,
    galleryImageUrls: [U.outdoorGarden],
    description:
      "גן מטופח בקרבת הים בנתניה. אווירה רומנטית, תאורה ערבית ואפשרות לחופה בחוץ.",
    eventTypes: ["חתונה", "חינה", "יום הולדת"],
  },
  {
    name: "אולם גלוריה באר שבע",
    city: "באר שבע",
    address: "רגר 25",
    venueType: "אולם",
    minGuests: 150,
    maxGuests: 420,
    minPrice: 190,
    maxPrice: 290,
    hallRentalMin: 25000,
    hallRentalMax: 45000,
    kashrut: "מהדרין",
    parkingKind: "adjacent",
    latitude: 31.2518,
    longitude: 34.7915,
    seaView: false,
    boutique: false,
    accessible: true,
    hasChuppa: true,
    hasFood: true,
    hasDanceFloor: true,
    hasTableSetup: true,
    hasSoundSystem: true,
    hasBridalRoom: true,
    coverImageUrl: U.banquet,
    galleryImageUrls: [U.weddingHall, U.champagne, U.cake],
    description:
      "אולם מוביל בדרום לאירועי משפחה ועסקים. מחירים תחרותיים ושירות מלא מהכניסה ועד הסיום.",
    eventTypes: ["חתונה", "בר מצווה", "אירוע עסקי"],
  },
  {
    name: "גן ואולם אחוזת היער ראשון לציון",
    city: "ראשון לציון",
    address: "הרצל 60",
    venueType: "גן ואולם",
    minGuests: 90,
    maxGuests: 300,
    minPrice: 250,
    maxPrice: 380,
    hallRentalMin: 27000,
    hallRentalMax: 50000,
    kashrut: "רגיל",
    parkingKind: "adjacent",
    latitude: 31.973,
    longitude: 34.7925,
    seaView: false,
    boutique: true,
    accessible: true,
    hasChuppa: true,
    hasFood: true,
    hasDanceFloor: true,
    hasTableSetup: true,
    hasSoundSystem: true,
    hasBridalRoom: true,
    coverImageUrl: U.glassHall,
    galleryImageUrls: [U.outdoorGarden, U.chuppah],
    description:
      "מתחם ירוק עם אולם מקורה — אידיאלי לחתונות עם קבלת פנים בחוץ ואירוע בפנים.",
    eventTypes: ["חתונה", "ברית", "בת מצווה"],
  },
  {
    name: "אולם מלכות רמת גן",
    city: "רמת גן",
    address: "ביאליק 112",
    venueType: "אולם",
    minGuests: 200,
    maxGuests: 600,
    minPrice: 300,
    maxPrice: 450,
    hallRentalMin: 38000,
    hallRentalMax: 72000,
    kashrut: "מהדרין",
    parkingKind: "adjacent",
    latitude: 32.0684,
    longitude: 34.8248,
    seaView: false,
    boutique: false,
    accessible: true,
    hasChuppa: true,
    hasFood: true,
    hasDanceFloor: true,
    hasTableSetup: true,
    hasSoundSystem: true,
    hasBridalRoom: true,
    coverImageUrl: U.venueLights,
    galleryImageUrls: [U.weddingHall, U.modernHall, U.dance],
    description:
      "אחד האולמות הגדולים בגוש דן — קיבולת עד 600 אורחים, עיצוב מלכותי ומטבח כשר מהדרין.",
    eventTypes: ["חתונה", "בר מצווה", "בת מצווה", "כנס", "אירוע עסקי"],
  },
];

async function getOrCreateOwner() {
  let owner = await prisma.user.findUnique({
    where: { email: SEED_OWNER_EMAIL },
  });
  if (!owner) {
    const passwordHash = await bcrypt.hash("SampleVenues2026!", 10);
    owner = await prisma.user.create({
      data: {
        email: SEED_OWNER_EMAIL,
        name: "בעל אולמות דוגמה",
        passwordHash,
        role: "VENUE_OWNER",
        emailVerified: true,
        businessName: "Halls Hub — אולמות לדוגמה",
        businessPhone: "050-0000000",
      },
    });
    console.log("נוצר בעל אולם דוגמה:", owner.email);
  }
  return owner;
}

function galleryRows(venueId, coverImageUrl, galleryImageUrls) {
  const urls = [coverImageUrl, ...galleryImageUrls];
  const unique = [...new Set(urls)];
  return unique.map((url) => ({ venueId, url, category: "HALL" }));
}

async function updateVenueImages(venueId, v) {
  await prisma.$transaction([
    prisma.venue.update({
      where: { id: venueId },
      data: {
        coverImageUrl: v.coverImageUrl,
        galleryImageUrls: JSON.stringify(v.galleryImageUrls),
      },
    }),
    prisma.venueGalleryImage.deleteMany({ where: { venueId } }),
    prisma.venueGalleryImage.createMany({
      data: galleryRows(venueId, v.coverImageUrl, v.galleryImageUrls),
    }),
  ]);
}

async function main() {
  const owner = await getOrCreateOwner();

  if (FIX_IMAGES) {
    let fixed = 0;
    for (const v of VENUES) {
      const venue = await prisma.venue.findFirst({
        where: { ownerId: owner.id, name: v.name },
      });
      if (!venue) {
        console.log("לא נמצא:", v.name);
        continue;
      }
      await updateVenueImages(venue.id, v);
      fixed += 1;
      console.log(`✓ תמונות עודכנו: ${v.name} (id ${venue.id})`);
    }
    console.log(`\nסיום: עודכנו ${fixed} אולמות.`);
    return;
  }

  const existingCount = await prisma.venue.count({
    where: {
      ownerId: owner.id,
      description: { contains: SEED_MARKER },
    },
  });

  if (existingCount >= VENUES.length) {
    console.log(`כבר קיימים ${existingCount} אולמות דוגמה — מדלג.`);
    console.log("לתיקון תמונות: npm run seed:venues:fix-images");
    return;
  }

  let created = 0;
  for (const v of VENUES) {
    const dup = await prisma.venue.findFirst({
      where: { ownerId: owner.id, name: v.name },
    });
    if (dup) {
      console.log("קיים:", v.name);
      continue;
    }

    const venue = await prisma.venue.create({
      data: {
        ownerId: owner.id,
        name: v.name,
        city: v.city,
        address: v.address,
        venueType: v.venueType,
        minGuests: v.minGuests,
        maxGuests: v.maxGuests,
        minPrice: v.minPrice,
        maxPrice: v.maxPrice,
        hallRentalMin: v.hallRentalMin,
        hallRentalMax: v.hallRentalMax,
        kashrut: v.kashrut,
        parking: v.parkingKind === "adjacent" ? "חניה צמודה" : "חניון",
        parkingKind: v.parkingKind,
        latitude: v.latitude,
        longitude: v.longitude,
        seaView: v.seaView,
        boutique: v.boutique,
        accessible: v.accessible,
        hasChuppa: v.hasChuppa,
        hasFood: v.hasFood,
        hasDanceFloor: v.hasDanceFloor,
        hasTableSetup: v.hasTableSetup,
        hasSoundSystem: v.hasSoundSystem,
        hasBridalRoom: v.hasBridalRoom,
        coverImageUrl: v.coverImageUrl,
        galleryImageUrls: JSON.stringify(v.galleryImageUrls),
        description: `${v.description} ${SEED_MARKER}`,
        eventTypes: JSON.stringify(v.eventTypes),
        galleryImages: {
          create: galleryRows(0, v.coverImageUrl, v.galleryImageUrls).map(
            ({ url, category }) => ({ url, category })
          ),
        },
      },
    });
    created += 1;
    console.log(`+ ${venue.name} (id ${venue.id}) — ${v.city}`);
  }

  console.log(`\nסיום: נוצרו ${created} אולמות חדשים. סה"כ לבעל: ${existingCount + created}`);
  console.log(`התחברות בעל דוגמה: ${SEED_OWNER_EMAIL} / SampleVenues2026!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
