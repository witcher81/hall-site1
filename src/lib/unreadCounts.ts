import { prisma } from "@/lib/prisma";

/** מספר התראות שלא נקראו למשתמש */
export async function countUnreadNotifications(userId: number): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

/**
 * סה״כ הודעות שלא נקראו בכל השיחות של המשתמש (אותה לוגיקה כמו ב־GET /api/conversations).
 */
export async function countUnreadMessagesTotal(userId: number): Promise<number> {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
    select: {
      id: true,
      participant1Id: true,
      participant2Id: true,
      participant1LastReadAt: true,
      participant2LastReadAt: true,
    },
  });

  let total = 0;
  for (const c of conversations) {
    const lastReadAt =
      c.participant1Id === userId
        ? c.participant1LastReadAt
        : c.participant2LastReadAt;
    const n = await prisma.message.count({
      where: {
        conversationId: c.id,
        senderId: { not: userId },
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      },
    });
    total += n;
  }
  return total;
}
