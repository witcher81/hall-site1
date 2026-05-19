import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BUNDLE_BUILD_MODES,
  BUNDLE_STATUSES,
  bundleInclude,
  bundleToJson,
  normalizeBundleItemsInput,
} from "@/lib/seekerEventBundleApi";
import { serializeBundleItems } from "@/lib/seekerEventBundleTypes";
import { USER_INPUT_MAX, badRequest } from "@/lib/userInputValidation";

export const runtime = "nodejs";

function toOptionalId(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function toOptionalGuestCount(value: unknown): number | null {
  const n = toOptionalId(value);
  if (n == null) return null;
  if (n > USER_INPUT_MAX.GUEST_COUNT_MAX) return null;
  return n;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  if (user.role !== "SEEKER") {
    return NextResponse.json({ error: "זמין למחפשים בלבד" }, { status: 403 });
  }

  const rows = await prisma.seekerEventBundle.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: bundleInclude,
  });

  return NextResponse.json({ bundles: rows.map(bundleToJson) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  if (user.role !== "SEEKER") {
    return NextResponse.json({ error: "זמין למחפשים בלבד" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
  if (!eventType || eventType.length > USER_INPUT_MAX.EVENT_TYPE_FREE) {
    return badRequest("נא לבחור סוג אירוע");
  }

  const title = typeof body.title === "string" ? body.title.trim() || null : null;
  if (title && title.length > USER_INPUT_MAX.EVENT_PLAN_TITLE) {
    return badRequest("כותרת ארוכה מדי");
  }

  const eventDate =
    typeof body.eventDate === "string" ? body.eventDate.trim() || null : null;
  if (eventDate && eventDate.length > USER_INPUT_MAX.DATE_STRING) {
    return badRequest("תאריך לא תקין");
  }

  const area = typeof body.area === "string" ? body.area.trim() || null : null;
  if (area && area.length > USER_INPUT_MAX.AREA) {
    return badRequest("אזור ארוך מדי");
  }

  const venueId = toOptionalId(body.venueId);
  const guestCount = toOptionalGuestCount(body.guestCount);
  const budgetMin = toOptionalId(body.budgetMin);
  const budgetMax = toOptionalId(body.budgetMax);

  const buildMode =
    typeof body.buildMode === "string" && BUNDLE_BUILD_MODES.has(body.buildMode)
      ? body.buildMode
      : "manual";
  const status =
    typeof body.status === "string" && BUNDLE_STATUSES.has(body.status)
      ? body.status
      : "draft";

  const items = normalizeBundleItemsInput(body.items);
  if (body.items != null && items === null) {
    return badRequest("רשימת פריטים לא תקינה");
  }

  if (venueId != null) {
    const v = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true },
    });
    if (!v) return NextResponse.json({ error: "אולם לא נמצא" }, { status: 400 });
  }

  const row = await prisma.seekerEventBundle.create({
    data: {
      userId: user.id,
      title,
      eventType,
      eventDate,
      guestCount,
      area,
      budgetMin,
      budgetMax,
      venueId,
      buildMode,
      status,
      itemsJson: serializeBundleItems(items ?? []),
    },
    include: bundleInclude,
  });

  return NextResponse.json({ bundle: bundleToJson(row) }, { status: 201 });
}
