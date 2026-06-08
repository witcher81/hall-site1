import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function deleteVenueWithRelations(
  tx: Prisma.TransactionClient,
  venueId: number
): Promise<void> {
  await tx.inquiry.deleteMany({ where: { venueId } });
  await tx.favorite.deleteMany({ where: { venueId } });
  await tx.venueReview.deleteMany({ where: { venueId } });
  await tx.venueAvailability.deleteMany({ where: { venueId } });
  await tx.conversation.deleteMany({ where: { venueId } });
  await tx.venue.delete({ where: { id: venueId } });
}

async function deleteServiceWithRelations(
  tx: Prisma.TransactionClient,
  serviceId: number
): Promise<void> {
  await tx.conversation.updateMany({
    where: { serviceId },
    data: { serviceId: null },
  });
  await tx.serviceRequest.deleteMany({ where: { serviceId } });
  await tx.service.delete({ where: { id: serviceId } });
}

/**
 * מוחק משתמש וכל הנתונים הקשורים אליו (אולמות, שירותים, פניות, הודעות וכו').
 */
export async function deleteUserAccount(userId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
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
      await tx.message.deleteMany({ where: { conversationId: id } });
      await tx.conversation.delete({ where: { id } });
    }

    await tx.message.deleteMany({ where: { senderId: userId } });

    await tx.user.delete({ where: { id: userId } });
  });
}
