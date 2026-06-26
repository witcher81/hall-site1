import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emailVerificationGuard } from "@/lib/apiAuth";
import {
  contextKeyService,
  contextKeyVenue,
  orderedParticipants,
} from "@/lib/conversation-utils";

export const runtime = "nodejs";

/** רשימת שיחות של המשתמש המחובר */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ participant1Id: user.id }, { participant2Id: user.id }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      venue: { select: { id: true, name: true, city: true } },
      service: {
        select: { id: true, name: true, providerId: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
    },
  });

  const otherUserIds = conversations.map((c) =>
    c.participant1Id === user.id ? c.participant2Id : c.participant1Id
  );
  const others = await prisma.user.findMany({
    where: { id: { in: [...new Set(otherUserIds)] } },
    select: { id: true, name: true, email: true, role: true },
  });
  const otherMap = new Map(others.map((o) => [o.id, o]));
  const unreadRows = await Promise.all(
    conversations.map(async (c) => {
      const lastReadAt =
        c.participant1Id === user.id
          ? c.participant1LastReadAt
          : c.participant2LastReadAt;
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: user.id },
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        },
      });
      return [c.id, unreadCount] as const;
    })
  );
  const unreadMap = new Map(unreadRows);
  const totalUnread = unreadRows.reduce((sum, [, count]) => sum + count, 0);

  return NextResponse.json({
    totalUnread,
    conversations: conversations.map((c) => {
      const otherId =
        c.participant1Id === user.id ? c.participant2Id : c.participant1Id;
      const other = otherMap.get(otherId);
      const last = c.messages[0];
      return {
        id: c.id,
        contextKey: c.contextKey,
        venueId: c.venueId,
        serviceId: c.serviceId,
        venue: c.venue,
        service: c.service,
        otherUser: other ?? { id: otherId, name: null, email: "", role: "" },
        lastMessage: last
          ? { body: last.body, createdAt: last.createdAt.toISOString(), senderId: last.senderId }
          : null,
        unreadCount: unreadMap.get(c.id) ?? 0,
        updatedAt: c.updatedAt.toISOString(),
      };
    }),
  });
}

/**
 * יצירה או החזרת שיחה קיימת.
 * body: { venueId } | { serviceId } | { venueId, seekerId } כשבעל אולם פותח מול מחפש
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const verifyBlock = emailVerificationGuard(user);
  if (verifyBlock) return verifyBlock;

  const body = (await req.json().catch(() => null)) as {
    venueId?: number;
    serviceId?: number;
    seekerId?: number;
  } | null;

  const venueId =
    body?.venueId != null && Number.isInteger(Number(body.venueId))
      ? Number(body.venueId)
      : null;
  const serviceId =
    body?.serviceId != null && Number.isInteger(Number(body.serviceId))
      ? Number(body.serviceId)
      : null;
  const seekerId =
    body?.seekerId != null && Number.isInteger(Number(body.seekerId))
      ? Number(body.seekerId)
      : null;

  if ((venueId == null) === (serviceId == null)) {
    return NextResponse.json(
      { error: "Send exactly one of venueId or serviceId" },
      { status: 400 }
    );
  }

  let peerUserId: number;
  let contextKey: string;
  let vId: number | null = null;
  let sId: number | null = null;

  if (venueId != null) {
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, ownerId: true },
    });
    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }
    if (user.role === "SEEKER") {
      peerUserId = venue.ownerId;
    } else if (user.role === "VENUE_OWNER" && venue.ownerId === user.id) {
      if (!seekerId || seekerId <= 0) {
        return NextResponse.json(
          { error: "seekerId required when venue owner opens chat" },
          { status: 400 }
        );
      }
      const relatedInquiry = await prisma.inquiry.findFirst({
        where: { venueId, userId: seekerId },
        select: { id: true },
      });
      if (!relatedInquiry) {
        return NextResponse.json(
          { error: "אפשר לפתוח שיחה רק עם מחפש ששלח פנייה לאולם" },
          { status: 403 }
        );
      }
      peerUserId = seekerId;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    contextKey = contextKeyVenue(venueId);
    vId = venueId;
  } else if (serviceId != null) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, providerId: true },
    });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    if (user.role === "SEEKER") {
      peerUserId = service.providerId;
    } else if (user.role === "FREELANCER" && service.providerId === user.id) {
      if (!seekerId || seekerId <= 0) {
        return NextResponse.json(
          { error: "seekerId required when provider opens chat" },
          { status: 400 }
        );
      }
      const relatedRequest = await prisma.serviceRequest.findFirst({
        where: { serviceId, userId: seekerId },
        select: { id: true },
      });
      if (!relatedRequest) {
        return NextResponse.json(
          { error: "אפשר לפתוח שיחה רק עם מחפש ששלח בקשת שירות" },
          { status: 403 }
        );
      }
      peerUserId = seekerId;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    contextKey = contextKeyService(serviceId);
    sId = serviceId;
  } else {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (peerUserId === user.id) {
    return NextResponse.json({ error: "Cannot chat with yourself" }, { status: 400 });
  }

  const { participant1Id, participant2Id } = orderedParticipants(user.id, peerUserId);

  const existing = await prisma.conversation.findUnique({
    where: {
      participant1Id_participant2Id_contextKey: {
        participant1Id,
        participant2Id,
        contextKey,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ conversationId: existing.id });
  }

  const conv = await prisma.conversation.create({
    data: {
      participant1Id,
      participant2Id,
      contextKey,
      venueId: vId,
      serviceId: sId,
    },
    select: { id: true },
  });

  return NextResponse.json({ conversationId: conv.id }, { status: 201 });
}
