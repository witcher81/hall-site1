import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { assertThreadAccess } from "@/lib/negotiationAuth";
import { USER_INPUT_MAX, badRequest } from "@/lib/userInputValidation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; threadId: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, threadId: threadIdRaw } = await context.params;
  const inquiryId = Number(id);
  const threadId = Number(threadIdRaw);
  if (
    !Number.isInteger(inquiryId) ||
    inquiryId <= 0 ||
    !Number.isInteger(threadId) ||
    threadId <= 0
  ) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const access = await assertThreadAccess(threadId, user);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if (access.thread.inquiryId !== inquiryId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { body?: string } | null;
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text || text.length > USER_INPUT_MAX.CHAT_MESSAGE) {
    return badRequest("תוכן ההודעה לא תקין או ארוך מדי");
  }

  const msg = await prisma.message.create({
    data: {
      conversationId: access.thread.conversationId,
      senderId: user.id,
      body: text,
    },
    select: { id: true, createdAt: true },
  });

  await prisma.conversation.update({
    where: { id: access.thread.conversationId },
    data: { updatedAt: new Date() },
  });

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

  if (thread) {
    const recipients = new Set<number>();
    recipients.add(thread.inquiry.userId);
    recipients.add(thread.inquiry.venue.ownerId);
    if (thread.service?.providerId) recipients.add(thread.service.providerId);
    recipients.delete(user.id);

    await Promise.all(
      [...recipients].map((userId) =>
        createNotification({
          userId,
          type: "NEGOTIATION_MESSAGE",
          title: "הודעה חדשה בהתמקחות",
          body: "התקבלה הודעה חדשה בשרשור ההתמקחות.",
          href:
            userId === thread.inquiry.userId
              ? `/my-inquiries/${inquiryId}`
              : user.role === "FREELANCER"
                ? `/dashboard/freelancer/requests?inquiryId=${inquiryId}&threadId=${threadId}`
                : `/dashboard/venue-owner/inquiries/${inquiryId}`,
        })
      )
    );
  }

  return NextResponse.json({
    message: {
      type: "message",
      id: msg.id,
      senderId: user.id,
      body: text,
      createdAt: msg.createdAt.toISOString(),
    },
  });
}
