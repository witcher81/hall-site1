/**
 * יוצר 3 חבילות דוגמה (בסיס / משודרג / פרימיום) לאולם הראשון + עד 3 שירותים.
 * הרצה: npm run seed:packages
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TIERS = [
  {
    tier: "basic",
    title: "חבילת חתונה — בסיס",
    subtitle: "אולם + שירותי ליבה",
    bundlePriceFrom: 35000,
    bundlePriceTo: 55000,
    badgeLabel: null,
    sortOrder: 0,
  },
  {
    tier: "standard",
    title: "חבילת חתונה — משודרג",
    subtitle: "אולם + ספקים מומלצים",
    bundlePriceFrom: 55000,
    bundlePriceTo: 80000,
    badgeLabel: "הכי פופולרי",
    sortOrder: 1,
  },
  {
    tier: "premium",
    title: "חבילת חתונה — פרימיום",
    subtitle: "חוויה מלאה עם כל הספקים",
    bundlePriceFrom: 80000,
    bundlePriceTo: 120000,
    badgeLabel: "פרימיום",
    sortOrder: 2,
  },
];

async function main() {
  const venue = await prisma.venue.findFirst({ orderBy: { id: "asc" } });
  if (!venue) {
    console.log("אין אולמות בבסיס הנתונים — דלג.");
    return;
  }

  const services = await prisma.service.findMany({
    take: 3,
    orderBy: { id: "asc" },
  });

  const serviceSlots =
    services.length > 0
      ? services.map((s, i) => ({
          role: s.category?.trim() || ["צילום", "מוזיקה / DJ", "קייטרינג"][i] || "אחר",
          mode: i === 0 ? "included" : "recommended",
          serviceId: s.id,
          allowAlternatives: true,
        }))
      : [];

  let created = 0;
  for (const tpl of TIERS) {
    const existing = await prisma.eventPackage.findFirst({
      where: { venueId: venue.id, title: tpl.title },
    });
    if (existing) {
      if (!existing.isPublished) {
        await prisma.eventPackage.update({
          where: { id: existing.id },
          data: { isPublished: true },
        });
        console.log("פורסמה חבילה קיימת:", existing.id, tpl.title);
      } else {
        console.log("כבר קיימת:", existing.id, tpl.title);
      }
      continue;
    }

    const pkg = await prisma.eventPackage.create({
      data: {
        title: tpl.title,
        subtitle: tpl.subtitle,
        description:
          "דוגמה להדגמה — בעלי אולמות יכולים לערוך ולפרסם חבילות מהדשבורד. המחירים להמחשה בלבד.",
        venueId: venue.id,
        tier: tpl.tier,
        bundlePriceFrom: tpl.bundlePriceFrom,
        bundlePriceTo: tpl.bundlePriceTo,
        badgeLabel: tpl.badgeLabel,
        guestMin: venue.minGuests,
        guestMax: venue.maxGuests,
        eventTypesJson: JSON.stringify(["חתונה"]),
        serviceSlotsJson: serviceSlots.length > 0 ? JSON.stringify(serviceSlots) : null,
        isPublished: true,
        sortOrder: tpl.sortOrder,
        services:
          services.length > 0
            ? { create: services.map((s) => ({ serviceId: s.id })) }
            : undefined,
      },
    });
    console.log("נוצרה חבילה id:", pkg.id, "—", tpl.title);
    created += 1;
  }

  console.log(
    created > 0
      ? `סיום: ${created} חבילות חדשות לאולם "${venue.name}" (${venue.city}).`
      : `אין חבילות חדשות — בדקו /packages או פרסמו מדשבורד בעל אולם.`
  );
  if (services.length === 0) {
    console.log("לא נמצאו שירותים במאגר — החבילות ללא ספקים מקושרים.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
