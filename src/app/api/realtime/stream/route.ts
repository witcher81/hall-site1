import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  countUnreadMessagesTotal,
  countUnreadNotifications,
} from "@/lib/unreadCounts";

export const runtime = "nodejs";

/** Vercel Hobby: ~10s; נסגר מוקדם והלקוח מתחבר מחדש */
export const maxDuration = 10;

const STREAM_MS = 8_000;
const POLL_MS = 2_500;

function sseEncode(obj: object): Uint8Array {
  const line = `data: ${JSON.stringify(obj)}\n\n`;
  return new TextEncoder().encode(line);
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const convParam = req.nextUrl.searchParams.get("conversationId");
  const conversationId =
    convParam != null && /^\d+$/.test(convParam) ? Number(convParam) : null;

  if (conversationId != null) {
    const allowed = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: user.id }, { participant2Id: user.id }],
      },
      select: { id: true },
    });
    if (!allowed) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let lastNotif: number | null = null;
      let lastMsgTotal: number | null = null;
      let lastLatestMsgId: number | null = null;

      const tick = async () => {
        if (conversationId == null) {
          const [notifCount, msgTotal] = await Promise.all([
            countUnreadNotifications(user.id),
            countUnreadMessagesTotal(user.id),
          ]);
          if (lastNotif !== notifCount || lastMsgTotal !== msgTotal) {
            lastNotif = notifCount;
            lastMsgTotal = msgTotal;
            controller.enqueue(
              sseEncode({
                type: "badges",
                notifications: notifCount,
                messages: msgTotal,
              })
            );
          }
        }

        if (conversationId != null) {
          const latest = await prisma.message.findFirst({
            where: { conversationId },
            orderBy: { createdAt: "desc" },
            select: { id: true },
          });
          const lid = latest?.id ?? 0;
          if (lastLatestMsgId !== lid) {
            lastLatestMsgId = lid;
            controller.enqueue(
              sseEncode({
                type: "conversation",
                conversationId,
                messageLatestId: lid,
              })
            );
          }
        }
      };

      await tick().catch(() => {});
      const interval = setInterval(() => {
        void tick().catch(() => {});
      }, POLL_MS);

      const end = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const hardStop = setTimeout(end, STREAM_MS);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearTimeout(hardStop);
        end();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
