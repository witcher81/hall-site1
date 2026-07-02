/**
 * מחיקת משתמש לפי אימייל (כולל נתונים מקושרים).
 * שימוש: node scripts/delete-user-by-email.mjs ro3n@gmail.com
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m || process.env[m[1]] != null) continue;
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
    }
  } catch {
    /* no .env */
  }
}

async function deleteNegotiationThreadsForInquiry(tx, inquiryId) {
  const threads = await tx.negotiationThread.findMany({
    where: { inquiryId },
    select: { id: true },
  });
  for (const { id } of threads) {
    await tx.negotiationOffer.deleteMany({ where: { threadId: id } });
    await tx.negotiationThread.delete({ where: { id } });
  }
}

async function deleteNegotiationThreadsForConversation(tx, conversationId) {
  const threads = await tx.negotiationThread.findMany({
    where: { conversationId },
    select: { id: true },
  });
  for (const { id } of threads) {
    await tx.negotiationOffer.deleteMany({ where: { threadId: id } });
    await tx.negotiationThread.delete({ where: { id } });
  }
}

async function deleteVenueWithRelations(tx, venueId) {
  const inquiries = await tx.inquiry.findMany({
    where: { venueId },
    select: { id: true },
  });
  for (const { id } of inquiries) {
    await deleteNegotiationThreadsForInquiry(tx, id);
  }
  await tx.inquiry.deleteMany({ where: { venueId } });
  await tx.favorite.deleteMany({ where: { venueId } });
  await tx.venueReview.deleteMany({ where: { venueId } });
  await tx.venueAvailability.deleteMany({ where: { venueId } });
  await tx.conversation.deleteMany({ where: { venueId } });
  await tx.venue.delete({ where: { id: venueId } });
}

async function deleteServiceWithRelations(tx, serviceId) {
  await tx.conversation.updateMany({
    where: { serviceId },
    data: { serviceId: null },
  });
  await tx.serviceRequest.deleteMany({ where: { serviceId } });
  await tx.service.delete({ where: { id: serviceId } });
}

async function deleteUserAccount(tx, userId) {
  const venues = await tx.venue.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  for (const { id } of venues) {
    await deleteVenueWithRelations(tx, id);
  }

  const services = await tx.service.findMany({
    where: { providerId: userId },
    select: { id: true },
  });
  for (const { id } of services) {
    await deleteServiceWithRelations(tx, id);
  }

  await tx.negotiationOffer.deleteMany({ where: { authorUserId: userId } });

  const userInquiries = await tx.inquiry.findMany({
    where: { userId },
    select: { id: true },
  });
  for (const { id } of userInquiries) {
    await deleteNegotiationThreadsForInquiry(tx, id);
  }

  await tx.inquiry.deleteMany({ where: { userId } });
  await tx.serviceRequest.deleteMany({ where: { userId } });
  await tx.favorite.deleteMany({ where: { userId } });
  await tx.venueReview.deleteMany({ where: { userId } });
  await tx.serviceReview.deleteMany({ where: { userId } });

  const conversations = await tx.conversation.findMany({
    where: {
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
    select: { id: true },
  });
  for (const { id } of conversations) {
    await deleteNegotiationThreadsForConversation(tx, id);
    await tx.message.deleteMany({ where: { conversationId: id } });
    await tx.conversation.delete({ where: { id } });
  }

  await tx.message.deleteMany({ where: { senderId: userId } });
  await tx.user.delete({ where: { id: userId } });
}

loadEnv();

const email = (process.argv[2] || "").trim().toLowerCase();
const checkOnly = process.argv.includes("--check");

if (!email) {
  console.error("Usage: node scripts/delete-user-by-email.mjs <email>");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    console.log(`No user found for ${email}`);
    process.exit(0);
  }

  if (checkOnly) {
    console.log("User exists:", user);
    process.exit(0);
  }

  console.log("Deleting user:", user);
  await prisma.$transaction((tx) => deleteUserAccount(tx, user.id), {
    maxWait: 15000,
    timeout: 120000,
  });
  console.log(`Deleted user #${user.id} (${user.email})`);
} catch (e) {
  console.error("Delete failed:", e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
