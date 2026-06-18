import "server-only";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { userWantsEmailFromDb } from "@/lib/emailNotifications";
import {
  notifyNegotiationOfferAccepted,
  notifyNegotiationOfferReceived,
} from "@/lib/transactionalEmails";
import type { NegotiationAuthorRole } from "@/lib/negotiationTypes";
import { threadKindFromDb } from "@/lib/negotiationThreads";
import { assertThreadOpenForNegotiation } from "@/lib/negotiationAuth";

async function notifyOfferParties(input: {
  threadId: number;
  inquiryId: number;
  actorUserId: number;
  title: string;
  body: string;
  href: string;
}): Promise<void> {
  const thread = await prisma.negotiationThread.findUnique({
    where: { id: input.threadId },
    include: {
      inquiry: {
        select: {
          userId: true,
          venue: { select: { ownerId: true, name: true } },
        },
      },
      service: {
        select: {
          name: true,
          providerId: true,
          provider: { select: { email: true, name: true, businessName: true } },
        },
      },
    },
  });
  if (!thread) return;

  const recipients = new Set<number>();
  recipients.add(thread.inquiry.userId);
  recipients.add(thread.inquiry.venue.ownerId);
  if (thread.service?.providerId) {
    recipients.add(thread.service.providerId);
  }
  recipients.delete(input.actorUserId);

  await Promise.all(
    [...recipients].map((userId) =>
      createNotification({
        userId,
        type: "NEGOTIATION_UPDATE",
        title: input.title,
        body: input.body,
        href: input.href,
      })
    )
  );
}

export async function acceptNegotiationOffer(input: {
  offerId: number;
  actorUserId: number;
  actorRole: NegotiationAuthorRole;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const offer = await prisma.negotiationOffer.findUnique({
    where: { id: input.offerId },
    include: {
      thread: {
        include: {
          inquiry: {
            select: {
              id: true,
              userId: true,
              venue: { select: { ownerId: true, name: true } },
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              providerId: true,
              provider: { select: { email: true, name: true, businessName: true } },
            },
          },
        },
      },
    },
  });

  if (!offer || offer.status !== "PENDING") {
    return { ok: false, error: "הצעה לא זמינה לאישור" };
  }
  if (offer.authorUserId === input.actorUserId) {
    return { ok: false, error: "לא ניתן לאשר הצעה משלך" };
  }

  const open = assertThreadOpenForNegotiation(offer.thread);
  if (!open.ok) {
    return { ok: false, error: open.error };
  }

  const thread = offer.thread;
  const kind = threadKindFromDb(thread.kind);

  await prisma.$transaction(async (tx) => {
    await tx.negotiationOffer.update({
      where: { id: offer.id },
      data: { status: "ACCEPTED" },
    });
    await tx.negotiationOffer.updateMany({
      where: {
        threadId: thread.id,
        id: { not: offer.id },
        status: "PENDING",
      },
      data: { status: "SUPERSEDED" },
    });
    await tx.negotiationThread.update({
      where: { id: thread.id },
      data: { status: "DEAL_ACCEPTED" },
    });

    if (kind === "SUPPLIER" && thread.serviceRequestId) {
      await tx.serviceRequest.update({
        where: { id: thread.serviceRequestId },
        data: {
          status: "REPLIED",
          repliedAt: new Date(),
        },
      });
    }
  });

  const seekerHref = `/my-inquiries/${thread.inquiryId}`;
  const ownerHref = `/dashboard/venue-owner/inquiries/${thread.inquiryId}`;
  const freelancerHref = `/dashboard/freelancer/requests?inquiryId=${thread.inquiryId}&threadId=${thread.id}`;

  await notifyOfferParties({
    threadId: thread.id,
    inquiryId: thread.inquiryId,
    actorUserId: input.actorUserId,
    title: "הצעת מחיר התקבלה",
    body: "אחד הצדדים אישר הצעת מחיר.",
    href: seekerHref,
  });

  const seeker = await prisma.user.findUnique({
    where: { id: thread.inquiry.userId },
    select: { email: true, name: true },
  });
  if (seeker?.email && input.actorUserId !== thread.inquiry.userId) {
    if (await userWantsEmailFromDb(thread.inquiry.userId, "inquiryReply")) {
      notifyNegotiationOfferAccepted({
        recipientEmail: seeker.email,
        recipientName: seeker.name,
        venueName: thread.inquiry.venue.name,
        href: seekerHref,
      });
    }
  }

  if (kind === "VENUE" && thread.inquiry.venue.ownerId !== input.actorUserId) {
    const owner = await prisma.user.findUnique({
      where: { id: thread.inquiry.venue.ownerId },
      select: { email: true, name: true },
    });
    if (owner?.email && (await userWantsEmailFromDb(thread.inquiry.venue.ownerId, "newInquiry"))) {
      notifyNegotiationOfferAccepted({
        recipientEmail: owner.email,
        recipientName: owner.name,
        venueName: thread.inquiry.venue.name,
        href: ownerHref,
      });
    }
  }

  if (kind === "SUPPLIER" && thread.service?.providerId) {
    const provider = thread.service.provider;
    if (
      provider.email &&
      thread.service.providerId !== input.actorUserId &&
      (await userWantsEmailFromDb(thread.service.providerId, "newServiceRequest"))
    ) {
      notifyNegotiationOfferAccepted({
        recipientEmail: provider.email,
        recipientName: provider.businessName ?? provider.name,
        venueName: thread.service.name,
        href: freelancerHref,
      });
    }
  }

  return { ok: true };
}

export async function rejectNegotiationOffer(input: {
  offerId: number;
  actorUserId: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const offer = await prisma.negotiationOffer.findUnique({
    where: { id: input.offerId },
    select: {
      id: true,
      status: true,
      authorUserId: true,
      thread: { select: { id: true, inquiryId: true, status: true } },
    },
  });
  if (!offer || offer.status !== "PENDING") {
    return { ok: false, error: "הצעה לא זמינה לדחייה" };
  }
  if (offer.authorUserId === input.actorUserId) {
    return { ok: false, error: "לא ניתן לדחות הצעה משלך" };
  }

  const open = assertThreadOpenForNegotiation(offer.thread);
  if (!open.ok) {
    return { ok: false, error: open.error };
  }

  await prisma.negotiationOffer.update({
    where: { id: offer.id },
    data: { status: "REJECTED" },
  });

  await notifyOfferParties({
    threadId: offer.thread.id,
    inquiryId: offer.thread.inquiryId,
    actorUserId: input.actorUserId,
    title: "הצעת מחיר נדחתה",
    body: "אחד הצדדים דחה הצעת מחיר.",
    href: `/my-inquiries/${offer.thread.inquiryId}`,
  });

  return { ok: true };
}

export async function notifyNewOffer(input: {
  threadId: number;
  inquiryId: number;
  actorUserId: number;
  actorName: string | null;
}): Promise<void> {
  await notifyOfferParties({
    threadId: input.threadId,
    inquiryId: input.inquiryId,
    actorUserId: input.actorUserId,
    title: "הצעת מחיר חדשה",
    body: `${input.actorName?.trim() || "צד בשיחה"} שלח הצעת מחיר חדשה.`,
    href: `/my-inquiries/${input.inquiryId}`,
  });

  const thread = await prisma.negotiationThread.findUnique({
    where: { id: input.threadId },
    include: {
      inquiry: {
        select: {
          userId: true,
          venue: { select: { ownerId: true, name: true } },
        },
      },
    },
  });
  if (!thread) return;

  const recipients: { userId: number; email: string | null; name: string | null }[] = [];
  if (input.actorUserId !== thread.inquiry.userId) {
    const u = await prisma.user.findUnique({
      where: { id: thread.inquiry.userId },
      select: { email: true, name: true },
    });
    if (u) recipients.push({ userId: thread.inquiry.userId, ...u });
  }
  if (input.actorUserId !== thread.inquiry.venue.ownerId) {
    const u = await prisma.user.findUnique({
      where: { id: thread.inquiry.venue.ownerId },
      select: { email: true, name: true },
    });
    if (u)
      recipients.push({
        userId: thread.inquiry.venue.ownerId,
        ...u,
      });
  }

  for (const r of recipients) {
    if (!r.email) continue;
    const wants =
      r.userId === thread.inquiry.userId
        ? await userWantsEmailFromDb(r.userId, "inquiryReply")
        : await userWantsEmailFromDb(r.userId, "newInquiry");
    if (!wants) continue;
    notifyNegotiationOfferReceived({
      recipientEmail: r.email,
      recipientName: r.name,
      venueName: thread.inquiry.venue.name,
      href:
        r.userId === thread.inquiry.userId
          ? `/my-inquiries/${input.inquiryId}`
          : `/dashboard/venue-owner/inquiries/${input.inquiryId}`,
    });
  }
}
