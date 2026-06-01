import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { notifySeekerServiceRequestReplied } from "@/lib/transactionalEmails";
import {
  USER_INPUT_MAX,
  badRequest,
  validateOptionalLongText,
} from "@/lib/userInputValidation";

export const runtime = "nodejs";

/** רשימת הבקשות שהתקבלו לשירותים שלי */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const services = await prisma.service.findMany({
    where: { providerId: user.id },
    select: { id: true, name: true },
  });
  const serviceIds = services.map((s) => s.id);

  const requests = await prisma.serviceRequest.findMany({
    where: { serviceId: { in: serviceIds } },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      service: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json({ requests, services });
}

/** סימון בקשה כ־נקראה או נענתה */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = body.id != null ? Number(body.id) : NaN;
  const statusRaw = (body.status as string)?.toUpperCase();
  const status =
    statusRaw === "REPLIED" ? "REPLIED" : statusRaw === "READ" ? "READ" : "NEW";
  let providerNote: string | null = null;
  if (typeof body.providerNote === "string") {
    const noteRes = validateOptionalLongText(
      body.providerNote,
      USER_INPUT_MAX.OWNER_OR_PROVIDER_NOTE,
      "הערה"
    );
    if (!noteRes.ok) return badRequest(noteRes.error);
    providerNote = noteRes.value;
  }

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: { id },
    include: {
      service: { select: { providerId: true, name: true } },
      user: { select: { email: true, name: true } },
    },
  });
  if (!serviceRequest || serviceRequest.service.providerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const delegate = (prisma as { serviceRequest?: { update: (arg: object) => Promise<unknown> } }).serviceRequest;
  if (delegate) {
    await delegate.update({
      where: { id },
      data: {
        status,
        providerNote: status === "REPLIED" ? providerNote : (serviceRequest as { providerNote?: string | null }).providerNote,
        repliedAt: status === "REPLIED" ? new Date() : (serviceRequest as { repliedAt?: Date | null }).repliedAt,
      },
    });
  }

  if (status === "REPLIED" && serviceRequest.status !== "REPLIED") {
    await createNotification({
      userId: serviceRequest.userId,
      type: "INQUIRY_REPLIED",
      title: "בקשה נענתה",
      body: `הספק ענה לבקשה שלך עבור "${serviceRequest.service.name}".`,
      href: "/my-service-requests",
    });
    if (serviceRequest.user.email) {
      notifySeekerServiceRequestReplied({
        seekerEmail: serviceRequest.user.email,
        seekerName: serviceRequest.user.name,
        serviceName: serviceRequest.service.name,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
