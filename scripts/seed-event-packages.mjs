/**
 * יוצר חבילות מלאות (בסיס / משודרג / פרימיום) לכל האולמות — עם tier,
 * venueIncludesJson, serviceSlotsJson, ספקים מהמאגר ופרסום אוטומטי.
 *
 * הרצה: npm run seed:packages
 * אולם בודד: npm run seed:packages -- --venueId=14
 * עדכון קיים: npm run seed:packages -- --force
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TIERS = [
  {
    tier: "basic",
    titleSuffix: "בסיס",
    subtitle: "אולם + שירותי ליבה",
    priceFactor: { from: 1, to: 1.25 },
    badgeLabel: null,
    sortOrder: 0,
    venueIncludeKeys: ["hasTableSetup", "hasSoundSystem"],
    servicePlan: [
      { role: "מוזיקה / DJ", mode: "recommended", pick: "dj" },
    ],
  },
  {
    tier: "standard",
    titleSuffix: "משודרג",
    subtitle: "אולם + ספקים מומלצים",
    priceFactor: { from: 1.15, to: 1.45 },
    badgeLabel: "הכי פופולרי",
    sortOrder: 1,
    venueIncludeKeys: ["hasTableSetup", "hasSoundSystem", "hasFood", "hasDanceFloor"],
    servicePlan: [
      { role: "מוזיקה / DJ", mode: "included", pick: "dj" },
      { role: "צילום", mode: "recommended", pick: "photo" },
    ],
  },
  {
    tier: "premium",
    titleSuffix: "פרימיום",
    subtitle: "חוויה מלאה — אולם וספקים",
    priceFactor: { from: 1.35, to: 1.75 },
    badgeLabel: "פרימיום",
    sortOrder: 2,
    venueIncludeKeys: [
      "hasTableSetup",
      "hasSoundSystem",
      "hasFood",
      "hasDanceFloor",
      "chuppaCovered",
    ],
    servicePlan: [
      { role: "מוזיקה / DJ", mode: "included", pick: "dj" },
      { role: "צילום", mode: "included", pick: "photo" },
      { role: "קייטרינג", mode: "recommended", pick: "catering" },
    ],
  },
];

const BUILTIN_KEYS = new Set([
  "hasFood",
  "hasDanceFloor",
  "hasTableSetup",
  "hasSoundSystem",
]);

function parseEventTypes(raw) {
  if (!raw?.trim()) return ["חתונה"];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length ? arr : ["חתונה"];
  } catch {
    return ["חתונה"];
  }
}

function venueOffersBuiltin(venue, key) {
  if (key === "chuppaCovered") {
    return Boolean(venue.hasChuppa);
  }
  if (!BUILTIN_KEYS.has(key)) return false;
  return Boolean(venue[key]);
}

function buildVenueIncludes(venue, keys) {
  const out = [];
  for (const key of keys) {
    if (key === "chuppaCovered" && venueOffersBuiltin(venue, key)) {
      out.push({ venueOptionId: "service:chuppaCovered" });
    } else if (venueOffersBuiltin(venue, key)) {
      out.push({ venueOptionId: `service:${key}` });
    }
  }
  return out;
}

function pickServices(all) {
  const byPick = { dj: null, photo: null, catering: null };
  for (const s of all) {
    const cat = (s.category || "").toLowerCase();
    const name = (s.name || "").toLowerCase();
    if (!byPick.dj && (cat.includes("dj") || cat.includes("מוזיקה") || name.includes("dj"))) {
      byPick.dj = s;
    }
    if (!byPick.photo && (cat.includes("צילום") || cat.includes("צלם") || name.includes("צילום"))) {
      byPick.photo = s;
    }
    if (
      !byPick.catering &&
      (cat.includes("קייטרינג") || cat.includes("אוכל") || name.includes("קייטרינג"))
    ) {
      byPick.catering = s;
    }
  }
  if (!byPick.dj && all[0]) byPick.dj = all[0];
  if (!byPick.photo && all[1]) byPick.photo = all[1];
  if (!byPick.catering && all[2]) byPick.catering = all[2];
  return byPick;
}

function hallRange(venue) {
  const from = venue.hallRentalMin ?? venue.minPrice ?? 30000;
  const to = venue.hallRentalMax ?? venue.maxPrice ?? from;
  const hallFrom = typeof from === "number" && from > 1000 ? from : from * 100;
  const hallTo =
    typeof to === "number" && to > 1000
      ? Math.max(to, hallFrom)
      : Math.max(hallFrom * 1.4, hallFrom + 15000);
  return { hallFrom: Math.round(hallFrom), hallTo: Math.round(hallTo) };
}

function tierPrices(venue, factor) {
  const { hallFrom, hallTo } = hallRange(venue);
  const serviceBump = 8000;
  return {
    bundlePriceFrom: Math.round(hallFrom * factor.from + serviceBump * (factor.from - 0.85)),
    bundlePriceTo: Math.round(hallTo * factor.to + serviceBump * factor.to),
  };
}

function packageTitle(venueName, suffix) {
  const short = venueName.length > 28 ? `${venueName.slice(0, 26)}…` : venueName;
  return `חתונה ${suffix} — ${short}`;
}

async function upsertPackage(venue, tpl, servicesByPick, force) {
  const title = packageTitle(venue.name, tpl.titleSuffix);
  const existing = await prisma.eventPackage.findFirst({
    where: { venueId: venue.id, tier: tpl.tier },
  });

  const venueIncludes = buildVenueIncludes(venue, tpl.venueIncludeKeys);
  const serviceSlots = [];
  const serviceIds = new Set();

  for (const plan of tpl.servicePlan) {
    const svc = servicesByPick[plan.pick];
    if (!svc) continue;
    serviceIds.add(svc.id);
    serviceSlots.push({
      role: plan.role,
      mode: plan.mode,
      serviceId: svc.id,
      allowAlternatives: true,
    });
  }

  const prices = tierPrices(venue, tpl.priceFactor);
  const eventTypes = parseEventTypes(venue.eventTypes);
  const data = {
    title,
    subtitle: tpl.subtitle,
    description: `חבילת ${tpl.titleSuffix} לאירוע ב${venue.name}, ${venue.city}. כוללת רכיבי אולם נבחרים וספקים מהמאגר — מחיר להערכה בלבד; פירוט סופי מול האולם והספקים.`,
    bundlePriceFrom: prices.bundlePriceFrom,
    bundlePriceTo: prices.bundlePriceTo,
    badgeLabel: tpl.badgeLabel,
    guestMin: venue.minGuests,
    guestMax: venue.maxGuests,
    eventTypesJson: JSON.stringify(eventTypes),
    venueIncludesJson:
      venueIncludes.length > 0 ? JSON.stringify(venueIncludes) : null,
    serviceSlotsJson:
      serviceSlots.length > 0 ? JSON.stringify(serviceSlots) : null,
    isPublished: true,
    sortOrder: tpl.sortOrder,
  };

  if (existing) {
    if (!force) {
      console.log(`  כבר קיימת (${tpl.tier}): id=${existing.id}`);
      return { action: "skip", id: existing.id };
    }
    await prisma.$transaction(async (tx) => {
      await tx.eventPackage.update({ where: { id: existing.id }, data });
      await tx.eventPackageService.deleteMany({ where: { packageId: existing.id } });
      if (serviceIds.size > 0) {
        await tx.eventPackageService.createMany({
          data: [...serviceIds].map((serviceId) => ({
            packageId: existing.id,
            serviceId,
          })),
        });
      }
    });
    console.log(`  עודכנה (${tpl.tier}): id=${existing.id} — ${title}`);
    return { action: "update", id: existing.id };
  }

  const pkg = await prisma.eventPackage.create({
    data: {
      venueId: venue.id,
      tier: tpl.tier,
      ...data,
      services:
        serviceIds.size > 0
          ? { create: [...serviceIds].map((serviceId) => ({ serviceId })) }
          : undefined,
    },
  });
  console.log(`  נוצרה (${tpl.tier}): id=${pkg.id} — ${title}`);
  return { action: "create", id: pkg.id };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const venueIdArg = args.find((a) => a.startsWith("--venueId="));
  const onlyVenueId = venueIdArg ? Number(venueIdArg.split("=")[1]) : null;

  const venues = await prisma.venue.findMany({
    where:
      onlyVenueId && Number.isInteger(onlyVenueId)
        ? { id: onlyVenueId }
        : undefined,
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      city: true,
      minGuests: true,
      maxGuests: true,
      minPrice: true,
      maxPrice: true,
      hallRentalMin: true,
      hallRentalMax: true,
      eventTypes: true,
      hasChuppa: true,
      hasFood: true,
      hasDanceFloor: true,
      hasTableSetup: true,
      hasSoundSystem: true,
    },
  });

  if (venues.length === 0) {
    console.log("לא נמצאו אולמות.");
    return;
  }

  const allServices = await prisma.service.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true, category: true },
  });
  const servicesByPick = pickServices(allServices);

  console.log(
    `יוצר חבילות ל-${venues.length} אולמות (ספקים: DJ=${servicesByPick.dj?.name ?? "—"}, צילום=${servicesByPick.photo?.name ?? "—"}, קייטרינג=${servicesByPick.catering?.name ?? "—"})`
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const venue of venues) {
    console.log(`\nאולם #${venue.id}: ${venue.name} (${venue.city})`);
    for (const tpl of TIERS) {
      const r = await upsertPackage(venue, tpl, servicesByPick, force);
      if (r.action === "create") created += 1;
      else if (r.action === "update") updated += 1;
      else skipped += 1;
    }
  }

  // הסרת חבילת דוגמה ישנה ללא tier (אם יש 3 שכבות חדשות לאותו אולם)
  const legacy = await prisma.eventPackage.findMany({
    where: { tier: null, title: { contains: "דוגמה" } },
  });
  for (const row of legacy) {
    const tiered = await prisma.eventPackage.count({
      where: { venueId: row.venueId, tier: { not: null } },
    });
    if (tiered >= 3) {
      await prisma.eventPackage.delete({ where: { id: row.id } });
      console.log(`\nנמחקה חבילת דוגמה ישנה id=${row.id}`);
    }
  }

  const total = await prisma.eventPackage.count({ where: { isPublished: true } });
  console.log(
    `\nסיום: ${created} חדשות, ${updated} עודכנו, ${skipped} דולגו. סה"כ מפורסמות: ${total}.`
  );
  console.log("צפו ב-/packages ובעמודי האולמות.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
