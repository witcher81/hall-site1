import { prisma } from "@/lib/prisma";
import { ListingModerationStatus } from "@/lib/listingModerationTypes";

export type AdminDashboardStats = {
  pendingVenues: number;
  pendingServices: number;
  pendingTotal: number;
  openReports: number;
  blockedUsers: number;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [pendingVenues, pendingServices, openReports, blockedUsers] =
    await Promise.all([
      prisma.venue.count({
        where: { moderationStatus: ListingModerationStatus.PENDING },
      }),
      prisma.service.count({
        where: { moderationStatus: ListingModerationStatus.PENDING },
      }),
      prisma.contentReport.count({ where: { status: "OPEN" } }),
      prisma.user.count({ where: { isBlocked: true } }),
    ]);

  return {
    pendingVenues,
    pendingServices,
    pendingTotal: pendingVenues + pendingServices,
    openReports,
    blockedUsers,
  };
}
