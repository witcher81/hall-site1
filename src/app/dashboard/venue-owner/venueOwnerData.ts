import { prisma } from "@/lib/prisma";

export async function getVenueOwnerDashboardData(ownerId: number) {
  const [dbUser, venues] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ownerId },
      select: {
        name: true,
        email: true,
        phone: true,
        businessName: true,
        businessPhone: true,
      },
    }),
    prisma.venue.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const venueIds = venues.map((v) => v.id);
  const recentInquiries =
    venueIds.length === 0
      ? []
      : await prisma.inquiry.findMany({
          where: { venueId: { in: venueIds } },
          orderBy: { createdAt: "desc" },
          take: 3,
          include: {
            venue: { select: { id: true, name: true } },
            user: { select: { name: true, email: true } },
          },
        });

  return {
    dbUser,
    venues,
    recentInquiries: recentInquiries.map((q) => ({
      ...q,
      createdAt: q.createdAt.toISOString(),
      repliedAt: q.repliedAt ? q.repliedAt.toISOString() : null,
    })),
  };
}
