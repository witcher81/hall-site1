import "server-only";

import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { NegotiationAuthorRole } from "@/lib/negotiationTypes";
import { threadKindFromDb } from "@/lib/negotiationThreads";

export type NegotiationAccess =
  | { ok: true; role: NegotiationAuthorRole; inquiryId: number }
  | { ok: false; status: number; error: string };

export function authorRoleForUser(user: Pick<User, "id" | "role">): NegotiationAuthorRole {
  if (user.role === "VENUE_OWNER") return "VENUE_OWNER";
  if (user.role === "FREELANCER") return "FREELANCER";
  return "SEEKER";
}

export async function assertInquiryNegotiationAccess(
  inquiryId: number,
  user: Pick<User, "id" | "role">
): Promise<NegotiationAccess> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: {
      id: true,
      userId: true,
      venue: { select: { ownerId: true } },
    },
  });
  if (!inquiry) {
    return { ok: false, status: 404, error: "הזמנה לא נמצאה" };
  }

  if (user.role === "SEEKER" && inquiry.userId === user.id) {
    return { ok: true, role: "SEEKER", inquiryId: inquiry.id };
  }
  if (user.role === "VENUE_OWNER" && inquiry.venue.ownerId === user.id) {
    return { ok: true, role: "VENUE_OWNER", inquiryId: inquiry.id };
  }
  if (user.role === "FREELANCER") {
    const linked = await prisma.negotiationThread.findFirst({
      where: {
        inquiryId: inquiry.id,
        kind: "SUPPLIER",
        service: { providerId: user.id },
      },
      select: { id: true },
    });
    if (linked) {
      return { ok: true, role: "FREELANCER", inquiryId: inquiry.id };
    }
  }

  return { ok: false, status: 403, error: "אין הרשאה" };
}

export async function assertThreadAccess(
  threadId: number,
  user: Pick<User, "id" | "role">
): Promise<
  | {
      ok: true;
      role: NegotiationAuthorRole;
      thread: {
        id: number;
        inquiryId: number;
        kind: string;
        conversationId: number;
        status: string;
      };
    }
  | { ok: false; status: number; error: string }
> {
  const thread = await prisma.negotiationThread.findUnique({
    where: { id: threadId },
    include: {
      inquiry: {
        select: {
          userId: true,
          venue: { select: { ownerId: true } },
        },
      },
      service: { select: { providerId: true } },
    },
  });
  if (!thread) {
    return { ok: false, status: 404, error: "שרשור לא נמצא" };
  }

  const kind = threadKindFromDb(thread.kind);

  if (user.role === "SEEKER" && thread.inquiry.userId === user.id) {
    return {
      ok: true,
      role: "SEEKER",
      thread: {
        id: thread.id,
        inquiryId: thread.inquiryId,
        kind: thread.kind,
        conversationId: thread.conversationId,
        status: thread.status,
      },
    };
  }

  if (
    user.role === "VENUE_OWNER" &&
    kind === "VENUE" &&
    thread.inquiry.venue.ownerId === user.id
  ) {
    return {
      ok: true,
      role: "VENUE_OWNER",
      thread: {
        id: thread.id,
        inquiryId: thread.inquiryId,
        kind: thread.kind,
        conversationId: thread.conversationId,
        status: thread.status,
      },
    };
  }

  if (
    user.role === "FREELANCER" &&
    kind === "SUPPLIER" &&
    thread.service?.providerId === user.id
  ) {
    return {
      ok: true,
      role: "FREELANCER",
      thread: {
        id: thread.id,
        inquiryId: thread.inquiryId,
        kind: thread.kind,
        conversationId: thread.conversationId,
        status: thread.status,
      },
    };
  }

  return { ok: false, status: 403, error: "אין הרשאה לשרשור זה" };
}

/** חסימת פעולות כשהשרשור נסגר או שההסכם כבר נחתם */
export function assertThreadOpenForNegotiation(thread: {
  status: string;
}):
  | { ok: true }
  | { ok: false; status: number; error: string } {
  if (thread.status === "CLOSED") {
    return {
      ok: false,
      status: 400,
      error: "ההתמקחות נסגרה — לא ניתן לשלוח הודעות או הצעות.",
    };
  }
  if (thread.status === "DEAL_ACCEPTED") {
    return {
      ok: false,
      status: 400,
      error: "ההצעה כבר אושרה — לא ניתן לשנות את ההתמקחות.",
    };
  }
  return { ok: true };
}

export async function assertOfferAccess(
  offerId: number,
  user: Pick<User, "id" | "role">
): Promise<
  | {
      ok: true;
      role: NegotiationAuthorRole;
      offer: {
        id: number;
        threadId: number;
        authorUserId: number;
        status: string;
      };
      thread: {
        id: number;
        inquiryId: number;
        kind: string;
        conversationId: number;
        status: string;
        serviceRequestId: number | null;
      };
    }
  | { ok: false; status: number; error: string }
> {
  const offer = await prisma.negotiationOffer.findUnique({
    where: { id: offerId },
    include: {
      thread: {
        include: {
          inquiry: {
            select: {
              userId: true,
              venue: { select: { ownerId: true } },
            },
          },
          service: { select: { providerId: true } },
        },
      },
    },
  });
  if (!offer) {
    return { ok: false, status: 404, error: "הצעה לא נמצאה" };
  }

  const threadAccess = await assertThreadAccess(offer.threadId, user);
  if (!threadAccess.ok) return threadAccess;

  return {
    ok: true,
    role: threadAccess.role,
    offer: {
      id: offer.id,
      threadId: offer.threadId,
      authorUserId: offer.authorUserId,
      status: offer.status,
    },
    thread: {
      id: offer.thread.id,
      inquiryId: offer.thread.inquiryId,
      kind: offer.thread.kind,
      conversationId: offer.thread.conversationId,
      status: offer.thread.status,
      serviceRequestId: offer.thread.serviceRequestId,
    },
  };
}

/** האם המשתמש יכול לקבל/לדחות הצעה (לא מחבר ההצעה) */
export function canRespondToOffer(
  offerAuthorUserId: number,
  currentUserId: number
): boolean {
  return offerAuthorUserId !== currentUserId;
}
