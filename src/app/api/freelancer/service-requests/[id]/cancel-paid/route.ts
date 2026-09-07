import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cancelPaidServiceBooking } from "@/lib/bookingRefund";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id: idRaw } = await params;
  const serviceRequestId = Number(idRaw);
  if (!Number.isInteger(serviceRequestId) || serviceRequestId <= 0) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason : "";

  const result = await cancelPaidServiceBooking({
    serviceRequestId,
    cancelledByUserId: user.id,
    reason,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
