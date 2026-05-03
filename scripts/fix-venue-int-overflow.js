/**
 * One-time script: fix Venue rows where minPrice/maxPrice/minGuests/maxGuests
 * exceed INT range (2^31-1) so Prisma can read them.
 * Run: node scripts/fix-venue-int-overflow.js
 */
const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();

const MAX_INT = 2147483647;
const MIN_INT = -MAX_INT - 1;

async function main() {
  // פרמטרים מקושרים — לא שרשור מחרוזת SQL (מונע SQL injection גם בסקריפטים)
  const r1 = await prisma.$executeRaw(
    Prisma.sql`UPDATE "Venue" SET "minPrice" = NULL WHERE "minPrice" > ${MAX_INT} OR "minPrice" < ${MIN_INT}`
  );
  const r2 = await prisma.$executeRaw(
    Prisma.sql`UPDATE "Venue" SET "maxPrice" = NULL WHERE "maxPrice" > ${MAX_INT} OR "maxPrice" < ${MIN_INT}`
  );
  const r3 = await prisma.$executeRaw(
    Prisma.sql`UPDATE "Venue" SET "minGuests" = NULL WHERE "minGuests" > ${MAX_INT} OR "minGuests" < ${MIN_INT}`
  );
  const r4 = await prisma.$executeRaw(
    Prisma.sql`UPDATE "Venue" SET "maxGuests" = NULL WHERE "maxGuests" > ${MAX_INT} OR "maxGuests" < ${MIN_INT}`
  );
  console.log(
    "Fixed venue columns (minPrice, maxPrice, minGuests, maxGuests). Rows updated:",
    r1 + r2 + r3 + r4
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
