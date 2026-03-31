import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

/** רשימת הבקשות ששלחתי לספקים (מחפש) */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "SEEKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await prisma.serviceRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          category: true,
          minPrice: true,
          maxPrice: true,
          providerId: true,
          provider: {
            select: { id: true, name: true, businessName: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ requests });
}
