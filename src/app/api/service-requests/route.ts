import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

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
  const message = (body.message as string)?.trim();
  const eventType = (body.eventType as string)?.trim() || null;
  const preferredDate = (body.preferredDate as string)?.trim() || null;

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return NextResponse.json({ error: "נא לבחור שירות" }, { status: 400 });
  }
  if (!message || message.length < 10) {
    return NextResponse.json({ error: "הודעה חייבת להכיל לפחות 10 תווים" }, { status: 400 });
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
      preferredDate: preferredDate || null,
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
