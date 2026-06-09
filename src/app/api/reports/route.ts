import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getSiteLegalInfo } from "@/lib/siteLegal";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const TARGET_TYPES = new Set(["venue", "service", "provider"]);

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const body = await req.json().catch(() => ({}));
  const targetType = typeof body.targetType === "string" ? body.targetType.trim() : "";
  const targetId = Number(body.targetId);
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  const details = typeof body.details === "string" ? body.details.trim().slice(0, 2000) : "";

  if (!TARGET_TYPES.has(targetType) || !Number.isInteger(targetId) || targetId <= 0 || !reason) {
    return NextResponse.json({ error: "נתוני דיווח לא תקינים" }, { status: 400 });
  }

  const report = await prisma.contentReport.create({
    data: {
      reporterUserId: user?.id ?? null,
      targetType,
      targetId,
      reason,
      details: details || null,
    },
  });

  const adminEmails = (process.env.ADMIN_EMAILS?.trim() ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (adminEmails.length > 0) {
    const legal = getSiteLegalInfo();
    for (const to of adminEmails) {
      await sendEmail({
        to,
        subject: `[דיווח תוכן] ${targetType} #${targetId}`,
        html: `<div dir="rtl"><p>דיווח חדש #${report.id}</p><p>סוג: ${targetType}, מזהה: ${targetId}</p><p>סיבה: ${reason}</p><p>${details}</p><p>מדיניות: ${legal.privacyEmail}</p></div>`,
        text: `דיווח #${report.id}\n${targetType} ${targetId}\n${reason}\n${details}`,
      });
    }
  }

  return NextResponse.json({ ok: true, id: report.id });
}
