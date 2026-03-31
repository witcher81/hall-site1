import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

/** עדכון מענה אוטומטי לפניות בלבד (JSON) */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const venueId = Number(id);
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "מזהה אולם לא תקין" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const raw = (body as { autoReplyMessage?: unknown }).autoReplyMessage;
  if (typeof raw !== "string") {
    return NextResponse.json(
      { error: "נדרש שדה autoReplyMessage (מחרוזת)" },
      { status: 400 }
    );
  }
  const autoReplyMessage = raw.trim() || null;

  const venue = await prisma.venue.findFirst({
    where: { id: venueId, ownerId: user.id },
    select: { id: true },
  });
  if (!venue) {
    return NextResponse.json({ error: "אולם לא נמצא" }, { status: 404 });
  }

  await prisma.venue.update({
    where: { id: venueId },
    data: { autoReplyMessage },
  });

  return NextResponse.json({ ok: true, autoReplyMessage });
}
