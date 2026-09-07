import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureStripeConnectAccount,
  syncStripeConnectStatus,
} from "@/lib/stripeConnect";
import { isStripeConnectConfigured } from "@/lib/bookingPaymentConfig";
import { USER_FACING_UNAVAILABLE } from "@/lib/userFacingErrors";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "FREELANCER" && user.role !== "VENUE_OWNER")) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  if (!isStripeConnectConfigured()) {
    return NextResponse.json(
      { error: USER_FACING_UNAVAILABLE, configured: false },
      { status: 503 }
    );
  }

  const status = await syncStripeConnectStatus(user.id);
  return NextResponse.json({
    configured: true,
    ...status,
  });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "FREELANCER" && user.role !== "VENUE_OWNER")) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  if (!isStripeConnectConfigured()) {
    return NextResponse.json({ error: USER_FACING_UNAVAILABLE }, { status: 503 });
  }

  const result = await ensureStripeConnectAccount(user.id);
  if (!result) {
    return NextResponse.json({ error: USER_FACING_UNAVAILABLE }, { status: 503 });
  }

  return NextResponse.json({
    url: result.onboardingUrl,
    accountId: result.accountId,
  });
}
