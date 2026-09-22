/**
 * חד־פעמי: מאשר שירותים/אולמות PENDING שמוכנים לפרסום,
 * ומסמן adminReviewedAt לעסקים ישנים בלי סקירה.
 *
 * Dry-run:  node --env-file=.env scripts/approve-ready-pending-listings.mjs
 * Execute:  node --env-file=.env scripts/approve-ready-pending-listings.mjs --execute
 */
import { PrismaClient } from "@prisma/client";

const EXECUTE = process.argv.includes("--execute");
const prisma = new PrismaClient();
const DESC_MIN = 20;

function hasPricedMenu(menuJson) {
  if (!menuJson?.trim()) return false;
  let menu;
  try {
    menu = JSON.parse(menuJson);
  } catch {
    return false;
  }
  if (!menu || typeof menu !== "object") return false;

  const priced = (item) =>
    (item?.exactPrice != null && item.exactPrice > 0) ||
    (item?.minPrice != null && item.minPrice > 0) ||
    (item?.maxPrice != null && item.maxPrice > 0);

  for (const pkg of menu.packages ?? []) {
    if (pkg.perGuestPrice != null && pkg.perGuestPrice > 0) return true;
    if (pkg.perGuestMin != null && pkg.perGuestMin > 0) return true;
    for (const item of [...(pkg.includedItems ?? []), ...(pkg.extraItems ?? [])]) {
      if (priced(item)) return true;
    }
  }
  for (const section of menu.sections ?? []) {
    for (const item of section.items ?? []) {
      if (priced(item)) return true;
    }
  }
  return false;
}

function isServiceReady(s) {
  const desc = (s.shortDescription?.trim() || s.description?.trim() || "");
  const hasPrice =
    (s.minPrice != null && s.minPrice > 0) ||
    (s.maxPrice != null && s.maxPrice > 0) ||
    hasPricedMenu(s.menuJson);
  return Boolean(
    s.category?.trim() &&
      s.serviceArea?.trim() &&
      s.coverImageUrl?.trim() &&
      desc.length >= DESC_MIN &&
      hasPrice
  );
}

async function main() {
  const [pendingServices, pendingVenues, unreviewedBusinesses] =
    await Promise.all([
      prisma.service.findMany({
        where: { moderationStatus: "PENDING" },
        select: {
          id: true,
          name: true,
          category: true,
          serviceArea: true,
          shortDescription: true,
          description: true,
          coverImageUrl: true,
          minPrice: true,
          maxPrice: true,
          menuJson: true,
        },
      }),
      prisma.venue.findMany({
        where: { moderationStatus: "PENDING" },
        select: { id: true, name: true },
      }),
      prisma.user.findMany({
        where: {
          role: { in: ["FREELANCER", "VENUE_OWNER"] },
          adminReviewedAt: null,
        },
        select: { id: true, email: true, role: true },
      }),
    ]);

  const readyServices = pendingServices.filter(isServiceReady);
  const incompleteServices = pendingServices.filter((s) => !isServiceReady(s));
  // אולמות לא משתמשים ב־PENDING להשלמה — כל PENDING ישן = מודרציה ישנה
  const venuesToApprove = pendingVenues;

  console.log(
    JSON.stringify(
      {
        mode: EXECUTE ? "execute" : "dry-run",
        pendingServices: pendingServices.length,
        readyServicesToApprove: readyServices.map((s) => ({
          id: s.id,
          name: s.name,
        })),
        incompleteLeftPending: incompleteServices.map((s) => ({
          id: s.id,
          name: s.name,
        })),
        pendingVenuesToApprove: venuesToApprove.map((v) => ({
          id: v.id,
          name: v.name,
        })),
        businessesToMarkReviewed: unreviewedBusinesses.map((u) => ({
          id: u.id,
          email: u.email,
          role: u.role,
        })),
      },
      null,
      2
    )
  );

  if (!EXECUTE) {
    console.log("\nDry-run only. Pass --execute to apply.");
    return;
  }

  const now = new Date();

  if (readyServices.length > 0) {
    await prisma.service.updateMany({
      where: { id: { in: readyServices.map((s) => s.id) } },
      data: {
        moderationStatus: "APPROVED",
        moderationNote: null,
        moderatedAt: now,
        moderatedByUserId: null,
      },
    });
  }

  if (venuesToApprove.length > 0) {
    await prisma.venue.updateMany({
      where: { id: { in: venuesToApprove.map((v) => v.id) } },
      data: {
        moderationStatus: "APPROVED",
        moderationNote: null,
        moderatedAt: now,
        moderatedByUserId: null,
      },
    });
  }

  if (unreviewedBusinesses.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: unreviewedBusinesses.map((u) => u.id) } },
      data: { adminReviewedAt: now },
    });
  }

  console.log(
    `\nDone. approvedServices=${readyServices.length} approvedVenues=${venuesToApprove.length} businessesMarked=${unreviewedBusinesses.length}`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
