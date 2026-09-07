import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createInquiryBookingCheckout } from "@/lib/bookingCheckout";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SEEKER") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id: idRaw } = await params;
  const inquiryId = Number(idRaw);
  if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  const result = await createInquiryBookingCheckout(
    inquiryId,
    user.id,
    user.email
  );
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ url: result.url });
}
