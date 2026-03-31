import { prisma } from "@/lib/prisma";

export async function getVenueOwnerDashboardData(ownerId: number) {
  const [dbUser, venues] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ownerId },
      select: { name: true, email: true, phone: true },
    }),
    prisma.venue.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { dbUser, venues };
}
