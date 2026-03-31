/**
 * יוצר חבילת דוגמה: אולם ראשון + עד 3 שירותים ראשונים (אם קיימים).
 * הרצה: node scripts/seed-event-packages.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  const existing = await prisma.eventPackage.findFirst({
    where: { title: "חבילת חתונה — דוגמה" },
  });
  if (existing) {
    console.log("חבילת הדוגמה כבר קיימת (id:", existing.id, ")");
    return;
  }

  const pkg = await prisma.eventPackage.create({
    data: {
      title: "חבילת חתונה — דוגמה",
      subtitle: "אולם + ספקים נבחרים במקום אחד",
      description:
        "דוגמה להדגמה: אפשר לערוך או למחוק ב-Prisma Studio. המחירים להמחשה בלבד.",
      venueId: venue.id,
      bundlePriceFrom: 45000,
      bundlePriceTo: 85000,
      badgeLabel: "מובילים",
      isPublished: true,
      sortOrder: 0,
      services:
        services.length > 0
          ? {
              create: services.map((s) => ({ serviceId: s.id })),
            }
          : undefined,
    },
  });

  console.log("נוצרה חבילה id:", pkg.id, "לאולם:", venue.name);
  if (services.length === 0) {
    console.log("לא נמצאו שירותים — הוסף שירותים וקשר ידני ב-Studio או הרץ שוב.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
