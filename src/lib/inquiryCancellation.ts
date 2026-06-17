import "server-only";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { userWantsEmailFromDb } from "@/lib/emailNotifications";
import {
  notifyInquiryEventCancelledEmail,
  notifySupplierDeclinedEmail,
} from "@/lib/transactionalEmails";
import { releaseVenueDateForInquiry } from "@/lib/inquiryBookDate";

export type InquiryCancellationActor = "VENUE_OWNER" | "SEEKER" | "FREELANCER";

type InquiryParties = {
  inquiryId: number;
  venueName: string;
  venueId: number;
  preferredDate: string | null;
  seeker: { id: number; email: string; name: string | null };
  owner: { id: number; email: string; name: string | null };
  suppliers: Array<{
    providerId: number;
    email: string;
    name: string | null;
    serviceName: string;
    serviceRequestId: number;
  }>;
};

async function loadInquiryParties(inquiryId: number): Promise<InquiryParties | null> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: {
      id: true,
      preferredDate: true,
      user: { select: { id: true, email: true, name: true } },
      venue: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          owner: { select: { id: true, email: true, name: true } },
        },
      },
      serviceRequests: {
        where: { status: { not: "CANCELLED" } },
        select: {
          id: true,
          service: {
            select: {
              name: true,
              providerId: true,
              provider: { select: { id: true, email: true, name: true, businessName: true } },
            },
          },
        },
      },
    },
  });
  if (!inquiry) return null;

  const supplierMap = new Map<number, InquiryParties["suppliers"][number]>();
  for (const sr of inquiry.serviceRequests) {
    const provider = sr.service.provider;
    if (supplierMap.has(provider.id)) continue;
    supplierMap.set(provider.id, {
      providerId: provider.id,
      email: provider.email,
      name: provider.businessName ?? provider.name,
      serviceName: sr.service.name,
      serviceRequestId: sr.id,
    });
  }

  return {
    inquiryId: inquiry.id,
    venueName: inquiry.venue.name,
    venueId: inquiry.venue.id,
    preferredDate: inquiry.preferredDate,
    seeker: inquiry.user,
    owner: {
      id: inquiry.venue.owner.id,
      email: inquiry.venue.owner.email,
      name: inquiry.venue.owner.name,
    },
    suppliers: [...supplierMap.values()],
  };
}

function actorSummary(actor: InquiryCancellationActor, serviceName?: string): string {
  switch (actor) {
    case "VENUE_OWNER":
      return "בעל האולם ביטל את ההזמנה";
    case "SEEKER":
      return "המזמין ביטל את הבקשה";
    case "FREELANCER":
      return serviceName
        ? `הספק «${serviceName}» ביטל את השתתפותו באירוע`
        : "ספק ביטל את השתתפותו באירוע";
  }
}

function hrefForUser(
  role: "seeker" | "owner" | "freelancer",
  inquiryId: number
): string {
  switch (role) {
    case "seeker":
      return `/my-inquiries/${inquiryId}`;
    case "owner":
      return `/dashboard/venue-owner/inquiries/${inquiryId}`;
    case "freelancer":
      return `/dashboard/freelancer/requests?inquiryId=${inquiryId}`;
  }
}

/** סגירת שרשורי הצעות מחיר וביטול בקשות ספקים הקשורות לפנייה */
export async function finalizeInquiryCancellation(input: {
  inquiryId: number;
  releaseBookedDate?: boolean;
  venueId?: number;
  preferredDate?: string | null;
}): Promise<void> {
  await prisma.negotiationThread.updateMany({
    where: {
      inquiryId: input.inquiryId,
      status: { in: ["OPEN"] },
    },
    data: { status: "CLOSED" },
  });

  await prisma.serviceRequest.updateMany({
    where: { inquiryId: input.inquiryId, status: { not: "CANCELLED" } },
    data: { status: "CANCELLED" },
  });

  if (input.releaseBookedDate && input.venueId != null) {
    await releaseVenueDateForInquiry(input.venueId, input.preferredDate);
  }
}

/** הודעה לכל הצדדים שלא ביטלו — מזמין, בעל אולם וספקים */
export async function notifyInquiryCancelled(input: {
  inquiryId: number;
  actorUserId: number;
  actor: InquiryCancellationActor;
  /** כשהמזמין כבר קיבל הודעת דחייה ייעודית */
  skipSeeker?: boolean;
}): Promise<void> {
  const parties = await loadInquiryParties(input.inquiryId);
  if (!parties) return;

  const summary = actorSummary(input.actor);
  const title = "ההזמנה בוטלה";

  const tasks: Promise<unknown>[] = [];

  if (!input.skipSeeker && parties.seeker.id !== input.actorUserId) {
    const body = `${summary} עבור «${parties.venueName}».`;
    tasks.push(
      createNotification({
        userId: parties.seeker.id,
        type: "INQUIRY_CANCELLED",
        title,
        body,
        href: hrefForUser("seeker", parties.inquiryId),
      })
    );
    if (parties.seeker.email && (await userWantsEmailFromDb(parties.seeker.id, "inquiryReply"))) {
      notifyInquiryEventCancelledEmail({
        recipientEmail: parties.seeker.email,
        recipientName: parties.seeker.name,
        venueName: parties.venueName,
        summary,
        href: hrefForUser("seeker", parties.inquiryId),
      });
    }
  }

  if (parties.owner.id !== input.actorUserId) {
    const body = `${summary} עבור «${parties.venueName}».`;
    tasks.push(
      createNotification({
        userId: parties.owner.id,
        type: "INQUIRY_CANCELLED",
        title,
        body,
        href: hrefForUser("owner", parties.inquiryId),
      })
    );
    if (parties.owner.email && (await userWantsEmailFromDb(parties.owner.id, "newInquiry"))) {
      notifyInquiryEventCancelledEmail({
        recipientEmail: parties.owner.email,
        recipientName: parties.owner.name,
        venueName: parties.venueName,
        summary,
        href: hrefForUser("owner", parties.inquiryId),
      });
    }
  }

  for (const supplier of parties.suppliers) {
    if (supplier.providerId === input.actorUserId) continue;
    const body = `${summary} עבור «${parties.venueName}» — הבקשה לשירות «${supplier.serviceName}» בוטלה.`;
    tasks.push(
      createNotification({
        userId: supplier.providerId,
        type: "INQUIRY_CANCELLED",
        title,
        body,
        href: hrefForUser("freelancer", parties.inquiryId),
      })
    );
    if (
      supplier.email &&
      (await userWantsEmailFromDb(supplier.providerId, "newServiceRequest"))
    ) {
      notifyInquiryEventCancelledEmail({
        recipientEmail: supplier.email,
        recipientName: supplier.name,
        venueName: parties.venueName,
        summary: body,
        href: hrefForUser("freelancer", parties.inquiryId),
      });
    }
  }

  await Promise.all(tasks);
}

/** ספק מבטל בקשה בודדת — מודיע למזמין ובעל האולם */
export async function notifyFreelancerDeclinedService(input: {
  inquiryId: number;
  actorUserId: number;
  serviceName: string;
  venueName: string;
  seeker: { id: number; email: string; name: string | null };
  owner: { id: number; email: string; name: string | null };
}): Promise<void> {
  const summary = `הספק «${input.serviceName}» ביטל את השתתפותו באירוע באולם «${input.venueName}».`;
  const title = "ספק ביטל השתתפות";

  const tasks: Promise<unknown>[] = [];

  if (input.seeker.id !== input.actorUserId) {
    tasks.push(
      createNotification({
        userId: input.seeker.id,
        type: "INQUIRY_CANCELLED",
        title,
        body: summary,
        href: hrefForUser("seeker", input.inquiryId),
      })
    );
    if (input.seeker.email && (await userWantsEmailFromDb(input.seeker.id, "inquiryReply"))) {
      notifySupplierDeclinedEmail({
        recipientEmail: input.seeker.email,
        recipientName: input.seeker.name,
        venueName: input.venueName,
        serviceName: input.serviceName,
        href: hrefForUser("seeker", input.inquiryId),
      });
    }
  }

  if (input.owner.id !== input.actorUserId) {
    tasks.push(
      createNotification({
        userId: input.owner.id,
        type: "INQUIRY_CANCELLED",
        title,
        body: summary,
        href: hrefForUser("owner", input.inquiryId),
      })
    );
    if (input.owner.email && (await userWantsEmailFromDb(input.owner.id, "newInquiry"))) {
      notifySupplierDeclinedEmail({
        recipientEmail: input.owner.email,
        recipientName: input.owner.name,
        venueName: input.venueName,
        serviceName: input.serviceName,
        href: hrefForUser("owner", input.inquiryId),
      });
    }
  }

  await Promise.all(tasks);
}
