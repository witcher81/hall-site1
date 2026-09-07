import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAlternativesForCancelledPayment } from "@/lib/bookingAlternatives";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SEEKER") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { paymentId: paymentIdRaw } = await params;
  const paymentId = Number(paymentIdRaw);
  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  const result = await getAlternativesForCancelledPayment(paymentId, user.id);
  if (!result) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  return NextResponse.json(result);
}
