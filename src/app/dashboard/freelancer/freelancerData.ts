import { prisma } from "@/lib/prisma";

export async function getFreelancerDashboardData(providerId: number) {
  const [dbUser, services] = await Promise.all([
    prisma.user.findUnique({
      where: { id: providerId },
      select: { name: true, email: true, phone: true },
    }),
    prisma.service.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { dbUser, services };
}
