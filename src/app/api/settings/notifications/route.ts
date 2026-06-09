import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  parseEmailNotificationPrefs,
  serializeEmailNotificationPrefs,
  type EmailNotificationPrefs,
} from "@/lib/emailNotifications";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { emailNotificationsJson: true },
  });

  return NextResponse.json({
    prefs: parseEmailNotificationPrefs(dbUser?.emailNotificationsJson),
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const current = parseEmailNotificationPrefs(
    (
      await prisma.user.findUnique({
        where: { id: user.id },
        select: { emailNotificationsJson: true },
      })
    )?.emailNotificationsJson
  );

  const next: EmailNotificationPrefs = {
    inquiryReply:
      typeof body.inquiryReply === "boolean" ? body.inquiryReply : current.inquiryReply,
    newInquiry:
      typeof body.newInquiry === "boolean" ? body.newInquiry : current.newInquiry,
    serviceRequestReply:
      typeof body.serviceRequestReply === "boolean"
        ? body.serviceRequestReply
        : current.serviceRequestReply,
    newServiceRequest:
      typeof body.newServiceRequest === "boolean"
        ? body.newServiceRequest
        : current.newServiceRequest,
  };

  await prisma.user.update({
    where: { id: user.id },
    data: { emailNotificationsJson: serializeEmailNotificationPrefs(next) },
  });

  return NextResponse.json({ ok: true, prefs: next });
}
