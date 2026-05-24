import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { validatePreferredDateNotPast } from "@/lib/validatePreferredDate";
import {
  USER_INPUT_MAX,
  badRequest,
  validateRequiredText,
} from "@/lib/userInputValidation";

export const runtime = "nodejs";

/** שליחת בקשה לספק – משתמש מחובר בתפקיד מחפש */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר כדי לשלוח בקשה" }, { status: 401 });
  }
  if (user.role !== "SEEKER") {
    return NextResponse.json({ error: "רק מחפש אולמות יכול לשלוח בקשות לספקים" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const serviceId = body.serviceId != null ? Number(body.serviceId) : NaN;
  const msgResult = validateRequiredText(
    body.message,
    USER_INPUT_MAX.SERVICE_REQUEST_MESSAGE,
    10,
    "הודעה"
  );
  if (!msgResult.ok) {
    return badRequest(
      msgResult.error.includes("קצר") ? "הודעה חייבת להכיל לפחות 10 תווים" : msgResult.error
    );
  }
  const message = msgResult.value;
  const eventTypeRaw =
    typeof body.eventType === "string" ? body.eventType.trim() || null : null;
  if (eventTypeRaw && eventTypeRaw.length > USER_INPUT_MAX.EVENT_TYPE_FREE) {
    return badRequest("סוג אירוע ארוך מדי");
  }
  const eventType = eventTypeRaw;
  const preferredDateRaw =
    typeof body.preferredDate === "string" ? body.preferredDate.trim() || null : null;
  if (preferredDateRaw && preferredDateRaw.length > USER_INPUT_MAX.DATE_STRING) {
    return badRequest("תאריך לא תקין");
  }
  const dateCheck = validatePreferredDateNotPast(preferredDateRaw);
  if (!dateCheck.ok) return dateCheck.response;
  const preferredDate = dateCheck.value;

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return NextResponse.json({ error: "נא לבחור שירות" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, providerId: true, name: true },
  });
  if (!service) {
    return NextResponse.json({ error: "שירות לא נמצא" }, { status: 404 });
  }

  const request = await prisma.serviceRequest.create({
    data: {
      userId: user.id,
      serviceId,
      message,
      eventType,
      preferredDate,
    },
  });

  await createNotification({
    userId: service.providerId,
    type: "NEW_REQUEST",
    title: "בקשה חדשה לספק",
    body: `התקבלה בקשה חדשה עבור השירות "${service.name}".`,
    href: "/dashboard/freelancer/requests",
  });

  return NextResponse.json({ request }, { status: 201 });
}
