import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

/** רשימת הפניות ששלחתי (מחפש אולמות) */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inquiries = await prisma.inquiry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
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
        },
      },
    },
  });

  return NextResponse.json({ inquiries });
}
