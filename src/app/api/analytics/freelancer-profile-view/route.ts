import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { USER_INPUT_MAX } from "@/lib/userInputValidation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const providerUserId = Number((body as { providerUserId?: unknown }).providerUserId);
  if (
    !Number.isInteger(providerUserId) ||
    providerUserId <= 0 ||
    providerUserId > USER_INPUT_MAX.PRICE_MAX
  ) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: providerUserId, role: "FREELANCER" },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.freelancerProfileView.create({
      data: { providerUserId },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("freelancer-profile-view:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
