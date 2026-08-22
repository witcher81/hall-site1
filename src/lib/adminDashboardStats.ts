import { prisma } from "@/lib/prisma";
import { ListingModerationStatus } from "@/lib/listingModerationTypes";

const RECENT_LIVE_DAYS = 7;

export type AdminDashboardStats = {
  pendingVenues: number;
  pendingServices: number;
  pendingTotal: number;
  /** אולמות+שירותים שאושרו ופורסמו ב־7 הימים האחרונים */
  recentLiveTotal: number;
  openReports: number;
  blockedUsers: number;
  /** בעלי אולם / פרילנסרים שעדיין לא סומנו כנבדקו באדמין */
  newBusinessUsers: number;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const since = new Date();
  since.setDate(since.getDate() - RECENT_LIVE_DAYS);

  const [
    pendingVenues,
    pendingServices,
    recentVenues,
    recentServices,
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
    prisma.venue.count({
      where: {
        moderationStatus: ListingModerationStatus.APPROVED,
        createdAt: { gte: since },
      },
    }),
    prisma.service.count({
      where: {
        moderationStatus: ListingModerationStatus.APPROVED,
        createdAt: { gte: since },
      },
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
    recentLiveTotal: recentVenues + recentServices,
    openReports,
    blockedUsers,
    newBusinessUsers,
  };
}
