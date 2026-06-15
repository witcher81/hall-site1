import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  assertInquiryNegotiationAccess,
  authorRoleForUser,
} from "@/lib/negotiationAuth";
import { buildNegotiationHub } from "@/lib/negotiationHub";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const inquiryId = Number(id);
  if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const access = await assertInquiryNegotiationAccess(inquiryId, user);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const hub = await buildNegotiationHub(
    inquiryId,
    user.id,
    access.role
  );

  return NextResponse.json({ hub });
}
