import "server-only";

import { getAdminEmails } from "@/lib/admin";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type NotifyAdminsNewListingInput = {
  listingType: "VENUE" | "SERVICE";
  listingId: number;
  listingName: string;
  ownerName: string | null;
  ownerEmail: string;
};

/**
 * התראת אדמין כשאולם/שירות חדש עולה לאוויר מיד.
 */
export async function notifyAdminsNewListing(
  input: NotifyAdminsNewListingInput
): Promise<void> {
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) return;

  const admins = await prisma.user.findMany({
    where: { email: { in: adminEmails } },
    select: { id: true },
  });
  if (admins.length === 0) return;

  const kind = input.listingType === "VENUE" ? "אולם" : "שירות";
  const ownerLabel =
    input.ownerName?.trim() || input.ownerEmail || "משתמש עסקי";
  const adminHref =
    input.listingType === "VENUE"
      ? `/admin/content/venue/${input.listingId}`
      : `/admin/content/service/${input.listingId}`;

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: "ADMIN_NEW_LISTING",
        title: `${kind} חדש באוויר`,
        body: `«${input.listingName}» מאת ${ownerLabel} — כבר בחיפוש. בדקו בפאנל.`,
        href: adminHref,
      })
    )
  );
}
