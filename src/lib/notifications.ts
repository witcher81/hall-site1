import { prisma } from "@/lib/prisma";
import { sanitizeInternalAppHref } from "@/lib/safeHref";

type CreateNotificationInput = {
  userId: number;
  type:
    | "NEW_REQUEST"
    | "INQUIRY_REPLIED"
    | "INQUIRY_VIEWED"
    | "INQUIRY_APPROVED"
    | "INQUIRY_REJECTED"
    | "INQUIRY_AUTO_MESSAGE"
    | "NEGOTIATION_MESSAGE"
    | "NEGOTIATION_UPDATE"
    | "NEW_VENUE_IN_CITY"
    | "WELCOME";
  title: string;
  body?: string | null;
  href?: string | null;
};

export async function createNotification(input: CreateNotificationInput) {
  const href =
    input.href == null ? null : sanitizeInternalAppHref(input.href);
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      href,
    },
  });
}

