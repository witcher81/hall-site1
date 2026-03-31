import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  const pkg = await prisma.eventPackage.findFirst({
    where: { id: pid, isPublished: true },
    include: {
      venue: {
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          coverImageUrl: true,
          minGuests: true,
          maxGuests: true,
          minPrice: true,
          maxPrice: true,
          hallRentalMin: true,
          hallRentalMax: true,
          description: true,
        },
      },
      services: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              shortDescription: true,
              description: true,
              coverImageUrl: true,
              minPrice: true,
              maxPrice: true,
              providerId: true,
              provider: {
                select: {
                  id: true,
                  name: true,
                  businessName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!pkg) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  return NextResponse.json({ package: pkg });
}
