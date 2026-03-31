/**
 * One-time script: fix Venue rows where minPrice/maxPrice/minGuests/maxGuests
 * exceed INT range (2^31-1) so Prisma can read them.
 * Run: node scripts/fix-venue-int-overflow.js
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MAX_INT = 2147483647;

async function main() {
  // Use raw SQL so we don't trigger Prisma's Int conversion on read
  const r1 = await prisma.$executeRawUnsafe(
    "UPDATE Venue SET minPrice = NULL WHERE minPrice > ? OR minPrice < ?",
    MAX_INT,
    -MAX_INT - 1
  );
  const r2 = await prisma.$executeRawUnsafe(
    "UPDATE Venue SET maxPrice = NULL WHERE maxPrice > ? OR maxPrice < ?",
    MAX_INT,
    -MAX_INT - 1
  );
  const r3 = await prisma.$executeRawUnsafe(
    "UPDATE Venue SET minGuests = NULL WHERE minGuests > ? OR minGuests < ?",
    MAX_INT,
    -MAX_INT - 1
  );
  const r4 = await prisma.$executeRawUnsafe(
    "UPDATE Venue SET maxGuests = NULL WHERE maxGuests > ? OR maxGuests < ?",
    MAX_INT,
    -MAX_INT - 1
  );
  console.log("Fixed venue columns (minPrice, maxPrice, minGuests, maxGuests). Rows updated:", r1 + r2 + r3 + r4);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
