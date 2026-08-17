/**
 * מוחק את שאריות הבדיקה האישיות (אחרי wipe-seed).
 * node --env-file=.env scripts/wipe-my-test-listings.mjs --execute
 */
import { PrismaClient } from "@prisma/client";

const EXECUTE = process.argv.includes("--execute");
const prisma = new PrismaClient();

async function deleteVenues(venueIds) {
  if (venueIds.length === 0) return 0;
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
  await prisma.venueAvailability.deleteMany({ where: { venueId: { in: venueIds } } });
  await prisma.venuePageView.deleteMany({ where: { venueId: { in: venueIds } } });
  await prisma.eventPackageService.deleteMany({
    where: { package: { venueId: { in: venueIds } } },
  });
  await prisma.eventPackage.deleteMany({ where: { venueId: { in: venueIds } } });
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
  await prisma.venueGalleryImage.deleteMany({ where: { venueId: { in: venueIds } } });
  const r = await prisma.venue.deleteMany({ where: { id: { in: venueIds } } });
  return r.count;
}

async function deleteServices(serviceIds) {
  if (serviceIds.length === 0) return 0;
  await prisma.negotiationOffer.deleteMany({
    where: { thread: { serviceId: { in: serviceIds } } },
  });
  await prisma.negotiationThread.deleteMany({
    where: { serviceId: { in: serviceIds } },
  });
  await prisma.serviceRequest.deleteMany({ where: { serviceId: { in: serviceIds } } });
  await prisma.serviceFavorite.deleteMany({ where: { serviceId: { in: serviceIds } } });
  await prisma.serviceReview.deleteMany({ where: { serviceId: { in: serviceIds } } });
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
  const r = await prisma.service.deleteMany({ where: { id: { in: serviceIds } } });
  return r.count;
}

async function main() {
  const venues = await prisma.venue.findMany({
    select: {
      id: true,
      name: true,
      city: true,
      owner: { select: { id: true, email: true } },
    },
  });
  const services = await prisma.service.findMany({
    select: {
      id: true,
      name: true,
      provider: { select: { id: true, email: true } },
    },
  });

  console.log("mode:", EXECUTE ? "EXECUTE" : "DRY-RUN");
  console.log("venues to delete:", venues.length);
  for (const v of venues) console.log(`  #${v.id} ${v.name} (${v.city}) — ${v.owner.email}`);
  console.log("services to delete:", services.length);
  for (const s of services) console.log(`  #${s.id} ${s.name} — ${s.provider.email}`);

  if (!EXECUTE) {
    console.log("Re-run with --execute to delete.");
    return;
  }

  const venueCount = await deleteVenues(venues.map((v) => v.id));
  const serviceCount = await deleteServices(services.map((s) => s.id));
  console.log({ deletedVenues: venueCount, deletedServices: serviceCount });
  console.log({
    remainingVenues: await prisma.venue.count(),
    remainingServices: await prisma.service.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
