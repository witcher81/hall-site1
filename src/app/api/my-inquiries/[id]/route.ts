import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** פרטי פנייה / הזמנה למחפש */
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

  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, userId: user.id },
    include: {
      venue: {
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          minGuests: true,
          maxGuests: true,
          minPrice: true,
          maxPrice: true,
          ownerId: true,
        },
      },
    },
  });

  if (!inquiry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    inquiry: {
      ...inquiry,
      createdAt: inquiry.createdAt.toISOString(),
      repliedAt: inquiry.repliedAt ? inquiry.repliedAt.toISOString() : null,
    },
  });
}
