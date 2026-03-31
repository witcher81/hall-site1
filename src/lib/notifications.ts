import { prisma } from "@/lib/prisma";

type CreateNotificationInput = {
  userId: number;
  type: "NEW_REQUEST" | "INQUIRY_REPLIED" | "NEW_VENUE_IN_CITY";
  title: string;
  body?: string | null;
  href?: string | null;
};

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
    },
  });
}

