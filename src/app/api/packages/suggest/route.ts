import { NextRequest, NextResponse } from "next/server";
import { buildSuggestedPackages } from "@/lib/buildSuggestedPackages";
import { normalizeEventTypeLabel } from "@/lib/eventTypeOptions";
import { USER_INPUT_MAX, badRequest } from "@/lib/userInputValidation";

export const runtime = "nodejs";

/** האתר בונה 2–3 חבילות מוכנות לפי סוג אירוע + אזור + אורחים */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const eventTypeRaw =
    typeof body.eventType === "string" ? body.eventType.trim() : "";
  const area = typeof body.area === "string" ? body.area.trim() : "";
  const guestCountRaw = body.guestCount;
  const guestCount =
    guestCountRaw != null && guestCountRaw !== ""
      ? Number(guestCountRaw)
      : null;

  if (!eventTypeRaw || eventTypeRaw.length > USER_INPUT_MAX.EVENT_TYPE_FREE) {
    return badRequest("נא לבחור סוג אירוע");
  }
  if (area.length > USER_INPUT_MAX.CITY) {
    return badRequest("אזור ארוך מדי");
  }
  if (
    guestCount != null &&
    (!Number.isFinite(guestCount) ||
      guestCount < 1 ||
      guestCount > USER_INPUT_MAX.GUEST_COUNT_MAX)
  ) {
    return badRequest("כמות אורחים לא תקינה");
  }

  const eventType = normalizeEventTypeLabel(eventTypeRaw);
  const result = await buildSuggestedPackages({
    eventType,
    area,
    guestCount,
  });

  return NextResponse.json(result);
}
