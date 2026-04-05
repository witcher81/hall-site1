import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { USER_INPUT_MAX, badRequest } from "@/lib/userInputValidation";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

async function getConversationForUser(conversationId: number, userId: number) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
    select: { id: true, participant1Id: true, participant2Id: true },
  });
}

export async function GET(_req: NextRequest, context: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const convId = Number(id);
  if (!Number.isInteger(convId) || convId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const allowed = await getConversationForUser(convId, user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.conversation.update({
    where: { id: convId },
    data:
      user.id === allowed.participant1Id
        ? { participant1LastReadAt: new Date() }
        : { participant2LastReadAt: new Date() },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      senderId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest, context: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const convId = Number(id);
  if (!Number.isInteger(convId) || convId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const allowed = await getConversationForUser(convId, user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { body?: string } | null;
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text || text.length > USER_INPUT_MAX.CHAT_MESSAGE) {
    return badRequest("תוכן ההודעה לא תקין או ארוך מדי");
  }

  const msg = await prisma.message.create({
    data: {
      conversationId: convId,
      senderId: user.id,
      body: text,
    },
    select: { id: true, createdAt: true },
  });

  await prisma.conversation.update({
    where: { id: convId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    message: {
      id: msg.id,
      body: text,
      senderId: user.id,
      createdAt: msg.createdAt.toISOString(),
    },
  });
}
