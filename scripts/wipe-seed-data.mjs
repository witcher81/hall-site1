/**
 * מוחק נתוני דמו/seed בלבד.
 * שומר: כל אולם/שירות/משתמש שנוצר היום (אזור זמן ישראל),
 * וכל רשומה שאינה מסומנת כ-seed / @hallshub.local.
 *
 * הרצה:
 *   node --env-file=.env scripts/wipe-seed-data.mjs           # dry-run
 *   node --env-file=.env scripts/wipe-seed-data.mjs --execute # מחיקה בפועל
 */
import { PrismaClient } from "@prisma/client";
import {
  SERVICE_SEED_MARKER,
  VENUE_SEED_MARKER,
} from "./seed-lib.mjs";

const EXECUTE = process.argv.includes("--execute");
const prisma = new PrismaClient();

function israelTodayStart() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const d = parts.find((p) => p.type === "day").value;
  return new Date(`${y}-${m}-${d}T00:00:00+03:00`);
}

const todayStart = israelTodayStart();

async function main() {
  console.log(`mode: ${EXECUTE ? "EXECUTE" : "DRY-RUN"}`);
  console.log(`keep anything created on/after: ${todayStart.toISOString()}`);

  const seedVenues = await prisma.venue.findMany({
    where: {
      OR: [
        { description: { contains: VENUE_SEED_MARKER } },
        { moderationNote: { contains: "seed" } },
        { owner: { email: { endsWith: "@hallshub.local" } } },
      ],
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      owner: { select: { email: true } },
    },
  });

  const seedServices = await prisma.service.findMany({
    where: {
      OR: [
        { description: { contains: SERVICE_SEED_MARKER } },
        { moderationNote: { contains: "seed" } },
        { provider: { email: { endsWith: "@hallshub.local" } } },
      ],
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      provider: { select: { email: true } },
    },
  });

  const venuesToDelete = seedVenues.filter((v) => v.createdAt < todayStart);
  const venuesKeptToday = seedVenues.filter((v) => v.createdAt >= todayStart);
  const servicesToDelete = seedServices.filter((s) => s.createdAt < todayStart);
  const servicesKeptToday = seedServices.filter((s) => s.createdAt >= todayStart);

  const venueIds = venuesToDelete.map((v) => v.id);
  const serviceIds = servicesToDelete.map((s) => s.id);

  console.log("\nvenues to delete:", venuesToDelete.length);
  for (const v of venuesToDelete) {
    console.log(`  - #${v.id} ${v.name} (${v.owner.email})`);
  }
  if (venuesKeptToday.length) {
    console.log("seed venues KEPT (created today):", venuesKeptToday.length);
    for (const v of venuesKeptToday) {
      console.log(`  keep #${v.id} ${v.name}`);
    }
  }

  console.log("\nservices to delete:", servicesToDelete.length);
  for (const s of servicesToDelete) {
    console.log(`  - #${s.id} ${s.name} (${s.provider.email})`);
  }
  if (servicesKeptToday.length) {
    console.log("seed services KEPT (created today):", servicesKeptToday.length);
    for (const s of servicesKeptToday) {
      console.log(`  keep #${s.id} ${s.name}`);
    }
  }

  const sampleUsers = await prisma.user.findMany({
    where: { email: { endsWith: "@hallshub.local" } },
    select: { id: true, email: true, role: true, createdAt: true },
  });
  const usersToDelete = sampleUsers.filter((u) => u.createdAt < todayStart);
  const usersKeptToday = sampleUsers.filter((u) => u.createdAt >= todayStart);

  console.log("\nsample users to delete:", usersToDelete.length);
  for (const u of usersToDelete) {
    console.log(`  - #${u.id} ${u.email} (${u.role})`);
  }
  if (usersKeptToday.length) {
    console.log("sample users KEPT (created today):", usersKeptToday.length);
  }

  if (!EXECUTE) {
    console.log("\nDry-run only. Re-run with --execute to delete.");
    return;
  }

  // --- venues ---
  if (venueIds.length > 0) {
    const inquiries = await prisma.inquiry.findMany({
      where: { venueId: { in: venueIds } },
      select: { id: true },
    });
    const inquiryIds = inquiries.map((i) => i.id);

    if (inquiryIds.length > 0) {
      await prisma.negotiationOffer.deleteMany({
        where: { thread: { inquiryId: { in: inquiryIds } } },
      });
      await prisma.negotiationThread.deleteMany({
        where: { inquiryId: { in: inquiryIds } },
      });
      await prisma.serviceRequest.updateMany({
        where: { inquiryId: { in: inquiryIds } },
        data: { inquiryId: null },
      });
      await prisma.inquiry.deleteMany({ where: { id: { in: inquiryIds } } });
    }

    await prisma.favorite.deleteMany({ where: { venueId: { in: venueIds } } });
    await prisma.venueReview.deleteMany({ where: { venueId: { in: venueIds } } });
    await prisma.venueAvailability.deleteMany({
      where: { venueId: { in: venueIds } },
    });
    await prisma.venuePageView.deleteMany({
      where: { venueId: { in: venueIds } },
    });
    await prisma.eventPackageService.deleteMany({
      where: { package: { venueId: { in: venueIds } } },
    });
    await prisma.eventPackage.deleteMany({
      where: { venueId: { in: venueIds } },
    });
    await prisma.seekerEventBundle.updateMany({
      where: { venueId: { in: venueIds } },
      data: { venueId: null },
    });
    await prisma.eventPlan.updateMany({
      where: { venueId: { in: venueIds } },
      data: { venueId: null },
    });
    await prisma.conversation.updateMany({
      where: { venueId: { in: venueIds } },
      data: { venueId: null },
    });
    await prisma.payment.updateMany({
      where: { venueId: { in: venueIds } },
      data: { venueId: null },
    });
    await prisma.venueGalleryImage.deleteMany({
      where: { venueId: { in: venueIds } },
    });
    const vr = await prisma.venue.deleteMany({ where: { id: { in: venueIds } } });
    console.log(`deleted venues: ${vr.count}`);
  }

  // --- services ---
  if (serviceIds.length > 0) {
    await prisma.negotiationOffer.deleteMany({
      where: { thread: { serviceId: { in: serviceIds } } },
    });
    await prisma.negotiationThread.deleteMany({
      where: { serviceId: { in: serviceIds } },
    });
    await prisma.serviceRequest.deleteMany({
      where: { serviceId: { in: serviceIds } },
    });
    await prisma.serviceFavorite.deleteMany({
      where: { serviceId: { in: serviceIds } },
    });
    await prisma.serviceReview.deleteMany({
      where: { serviceId: { in: serviceIds } },
    });
    await prisma.eventPackageService.deleteMany({
      where: { serviceId: { in: serviceIds } },
    });
    await prisma.eventPlan.updateMany({
      where: { photographerServiceId: { in: serviceIds } },
      data: { photographerServiceId: null },
    });
    await prisma.eventPlan.updateMany({
      where: { djServiceId: { in: serviceIds } },
      data: { djServiceId: null },
    });
    await prisma.eventPlan.updateMany({
      where: { cateringServiceId: { in: serviceIds } },
      data: { cateringServiceId: null },
    });
    await prisma.conversation.updateMany({
      where: { serviceId: { in: serviceIds } },
      data: { serviceId: null },
    });
    await prisma.payment.updateMany({
      where: { serviceId: { in: serviceIds } },
      data: { serviceId: null },
    });
    const sr = await prisma.service.deleteMany({
      where: { id: { in: serviceIds } },
    });
    console.log(`deleted services: ${sr.count}`);
  }

  // --- sample users (@hallshub.local), after their listings are gone ---
  const userIds = usersToDelete.map((u) => u.id);
  if (userIds.length > 0) {
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.favorite.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.serviceFavorite.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.venueReview.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.serviceReview.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.serviceRequest.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.inquiry.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.payment.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.passwordResetToken.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.seekerEventBundle.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.eventPlan.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.contentReport.deleteMany({
      where: { reporterUserId: { in: userIds } },
    });
    await prisma.listingModerationEvent.deleteMany({
      where: { actorUserId: { in: userIds } },
    });
    await prisma.devManagedUser.deleteMany({
      where: {
        OR: [
          { managedUserId: { in: userIds } },
          { adminUserId: { in: userIds } },
        ],
      },
    });

    const convs = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: { in: userIds } },
          { participant2Id: { in: userIds } },
        ],
      },
      select: { id: true },
    });
    if (convs.length) {
      const cids = convs.map((c) => c.id);
      await prisma.negotiationOffer.deleteMany({
        where: { thread: { conversationId: { in: cids } } },
      });
      await prisma.negotiationThread.deleteMany({
        where: { conversationId: { in: cids } },
      });
      await prisma.message.deleteMany({ where: { conversationId: { in: cids } } });
      await prisma.conversation.deleteMany({ where: { id: { in: cids } } });
    }

    // leftover messages sent by sample users in other conversations
    await prisma.message.deleteMany({ where: { senderId: { in: userIds } } });

    const ur = await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    console.log(`deleted sample users: ${ur.count}`);
  }

  const remainingVenues = await prisma.venue.count();
  const remainingServices = await prisma.service.count();
  const remainingSampleUsers = await prisma.user.count({
    where: { email: { endsWith: "@hallshub.local" } },
  });
  console.log("\ndone.", {
    remainingVenues,
    remainingServices,
    remainingSampleUsers,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
