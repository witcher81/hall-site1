import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertThreadAccess } from "@/lib/negotiationAuth";
import { requestSeekerReQuote } from "@/lib/negotiationPricingRules";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; threadId: string }> };

export async function POST(_req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, threadId: threadIdRaw } = await context.params;
  const inquiryId = Number(id);
  const threadId = Number(threadIdRaw);
  if (
    !Number.isInteger(inquiryId) ||
    inquiryId <= 0 ||
    !Number.isInteger(threadId) ||
    threadId <= 0
  ) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const access = await assertThreadAccess(threadId, user);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if (access.thread.inquiryId !== inquiryId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (access.role !== "SEEKER") {
    return NextResponse.json(
      { error: "רק המבקש יכול לבקש ציטוט מחדש" },
      { status: 403 }
    );
  }

  const result = await requestSeekerReQuote({
    threadId,
    actorUserId: user.id,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
