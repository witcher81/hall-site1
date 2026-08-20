import { prisma } from "@/lib/prisma";
import { ListingModerationStatus } from "@/lib/listingModerationTypes";

export type AdminDashboardStats = {
  pendingVenues: number;
  pendingServices: number;
  pendingTotal: number;
  openReports: number;
  blockedUsers: number;
  /** בעלי אולם / פרילנסרים שעדיין לא סומנו כנבדקו באדמין */
  newBusinessUsers: number;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [
    pendingVenues,
    pendingServices,
    openReports,
    blockedUsers,
    newBusinessUsers,
  ] = await Promise.all([
    prisma.venue.count({
      where: { moderationStatus: ListingModerationStatus.PENDING },
    }),
    prisma.service.count({
      where: { moderationStatus: ListingModerationStatus.PENDING },
    }),
    prisma.contentReport.count({ where: { status: "OPEN" } }),
    prisma.user.count({ where: { isBlocked: true } }),
    prisma.user.count({
      where: {
        role: { in: ["VENUE_OWNER", "FREELANCER"] },
        isBlocked: false,
        adminReviewedAt: null,
      },
    }),
  ]);

  return {
    pendingVenues,
    pendingServices,
    pendingTotal: pendingVenues + pendingServices,
    openReports,
    blockedUsers,
    newBusinessUsers,
  };
}
