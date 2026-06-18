import { prisma } from "@/lib/prisma";

export async function getFreelancerDashboardData(providerId: number) {
  const [dbUser, services] = await Promise.all([
    prisma.user.findUnique({
      where: { id: providerId },
      select: { name: true, email: true, phone: true, businessName: true },
    }),
    prisma.service.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serviceIds = services.map((s) => s.id);
  const recentRequests =
    serviceIds.length === 0
      ? []
      : await prisma.serviceRequest.findMany({
          where: { serviceId: { in: serviceIds } },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            user: { select: { name: true, email: true } },
            service: { select: { id: true, name: true } },
          },
        });

  return {
    dbUser,
    services,
    recentRequests: recentRequests.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      repliedAt: r.repliedAt ? r.repliedAt.toISOString() : null,
    })),
  };
}
