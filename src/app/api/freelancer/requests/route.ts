import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { userWantsEmailFromDb } from "@/lib/emailNotifications";
import { notifySeekerServiceRequestReplied } from "@/lib/transactionalEmails";
import {
  notifyFreelancerDeclinedService,
  syncCancelledServiceRequestsForEndedInquiries,
} from "@/lib/inquiryCancellation";
import {
  isServiceRequestCancelled,
} from "@/lib/serviceRequestStatus";
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
      inquiry: {
        select: { id: true, status: true },
      },
      negotiationThread: {
        select: {
          id: true,
          inquiryId: true,
          inquiry: { select: { id: true, status: true } },
        },
      },
    },
  });

  await syncCancelledServiceRequestsForEndedInquiries(requests);

  return NextResponse.json({
    requests: requests.map((r) => {
      const inquiryId =
        r.inquiryId ?? r.negotiationThread?.inquiryId ?? r.inquiry?.id ?? null;
      const inquiryStatus =
        r.inquiry?.status ?? r.negotiationThread?.inquiry?.status ?? null;
      const cancelled = isServiceRequestCancelled(r.status, inquiryStatus);
      return {
        ...r,
        inquiryId,
        inquiryStatus,
        status: cancelled ? "CANCELLED" : r.status,
        negotiationThreadId: r.negotiationThread?.id ?? null,
      };
    }),
    services,
  });
}

/** סימון בקשה כ־נקראה, נענתה או ביטול השתתפות */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = body.id != null ? Number(body.id) : NaN;
  const action =
    typeof body.action === "string" ? body.action.trim().toLowerCase() : "";

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: { id },
    include: {
      service: { select: { providerId: true, name: true } },
      user: { select: { id: true, email: true, name: true } },
      inquiry: {
        select: {
          id: true,
          venue: {
            select: {
              name: true,
              ownerId: true,
              owner: { select: { id: true, email: true, name: true } },
            },
          },
        },
      },
    },
  });
  if (!serviceRequest || serviceRequest.service.providerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "decline") {
    if (serviceRequest.status === "CANCELLED") {
      return NextResponse.json({ ok: true, status: "CANCELLED" });
    }
    await prisma.serviceRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    if (serviceRequest.inquiry) {
      await notifyFreelancerDeclinedService({
        inquiryId: serviceRequest.inquiry.id,
        actorUserId: user.id,
        serviceName: serviceRequest.service.name,
        venueName: serviceRequest.inquiry.venue.name,
        seeker: serviceRequest.user,
        owner: {
          id: serviceRequest.inquiry.venue.owner.id,
          email: serviceRequest.inquiry.venue.owner.email,
          name: serviceRequest.inquiry.venue.owner.name,
        },
      });
    }
    return NextResponse.json({ ok: true, status: "CANCELLED" });
  }

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

  await prisma.serviceRequest.update({
    where: { id },
    data: {
      status,
      providerNote:
        status === "REPLIED" ? providerNote : serviceRequest.providerNote,
      repliedAt: status === "REPLIED" ? new Date() : serviceRequest.repliedAt,
    },
  });

  if (status === "REPLIED" && serviceRequest.status !== "REPLIED") {
    await createNotification({
      userId: serviceRequest.userId,
      type: "INQUIRY_REPLIED",
      title: "בקשה נענתה",
      body: `הספק ענה לבקשה שלך עבור "${serviceRequest.service.name}".`,
      href: "/my-service-requests",
    });
    if (
      serviceRequest.user.email &&
      (await userWantsEmailFromDb(serviceRequest.userId, "serviceRequestReply"))
    ) {
      notifySeekerServiceRequestReplied({
        seekerEmail: serviceRequest.user.email,
        seekerName: serviceRequest.user.name,
        serviceName: serviceRequest.service.name,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
