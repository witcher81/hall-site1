import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildAutoEventBundle } from "@/lib/buildAutoEventBundle";
import { USER_INPUT_MAX, badRequest } from "@/lib/userInputValidation";

export const runtime = "nodejs";

/** הצעת חבילה אוטומטית לפי אולם + סוג אירוע (ללא שמירה) */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  if (user.role !== "SEEKER") {
    return NextResponse.json({ error: "זמין למחפשים בלבד" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const venueId = Number(body.venueId);
  const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
  const guestCountRaw = body.guestCount;
  const guestCount =
    guestCountRaw != null && guestCountRaw !== "" ? Number(guestCountRaw) : null;

  if (!Number.isInteger(venueId) || venueId <= 0) {
    return NextResponse.json({ error: "נא לבחור אולם" }, { status: 400 });
  }
  if (!eventType || eventType.length > USER_INPUT_MAX.EVENT_TYPE_FREE) {
    return badRequest("נא לבחור סוג אירוע");
  }
  if (
    guestCount != null &&
    (!Number.isFinite(guestCount) || guestCount < 1 || guestCount > USER_INPUT_MAX.GUEST_COUNT_MAX)
  ) {
    return badRequest("כמות אורחים לא תקינה");
  }

  const built = await buildAutoEventBundle({
    venueId,
    eventType,
    guestCount,
  });

  if (!built) {
    return NextResponse.json({ error: "אולם לא נמצא" }, { status: 404 });
  }

  return NextResponse.json({
    venueId,
    venueName: built.venueName,
    items: built.items,
    savingsHint: built.savingsHint,
  });
}
