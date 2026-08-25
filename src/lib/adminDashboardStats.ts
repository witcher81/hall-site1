import { prisma } from "@/lib/prisma";
import { ListingModerationStatus } from "@/lib/listingModerationTypes";

const RECENT_LIVE_DAYS = 7;
const WORK_QUEUE_LIMIT = 10;
const RECENT_SIGNUPS_LIMIT = 12;

export type AdminDashboardStats = {
  pendingVenues: number;
  pendingServices: number;
  pendingTotal: number;
  recentLiveTotal: number;
  openReports: number;
  blockedUsers: number;
  newBusinessUsers: number;
  totalUsers: number;
  totalSeekers: number;
  totalVenueOwners: number;
  totalFreelancers: number;
  liveVenues: number;
  liveServices: number;
  newUsersThisWeek: number;
  unverifiedUsers: number;
};

export type AdminWorkQueueItem = {
  kind: "business" | "report" | "content";
  href: string;
  title: string;
  subtitle: string;
  meta: string;
};

export type AdminRecentSignup = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  emailVerified: boolean;
  isBlocked: boolean;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const since = new Date();
  since.setDate(since.getDate() - RECENT_LIVE_DAYS);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    pendingVenues,
    pendingServices,
    recentVenues,
    recentServices,
    openReports,
    blockedUsers,
    newBusinessUsers,
    totalUsers,
    totalSeekers,
    totalVenueOwners,
    totalFreelancers,
    liveVenues,
    liveServices,
    newUsersThisWeek,
    unverifiedUsers,
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
    prisma.user.count(),
    prisma.user.count({ where: { role: "SEEKER" } }),
    prisma.user.count({ where: { role: "VENUE_OWNER" } }),
    prisma.user.count({ where: { role: "FREELANCER" } }),
    prisma.venue.count({
      where: { moderationStatus: ListingModerationStatus.APPROVED },
    }),
    prisma.service.count({
      where: { moderationStatus: ListingModerationStatus.APPROVED },
    }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { emailVerified: false } }),
  ]);

  return {
    pendingVenues,
    pendingServices,
    pendingTotal: pendingVenues + pendingServices,
    recentLiveTotal: recentVenues + recentServices,
    openReports,
    blockedUsers,
    newBusinessUsers,
    totalUsers,
    totalSeekers,
    totalVenueOwners,
    totalFreelancers,
    liveVenues,
    liveServices,
    newUsersThisWeek,
    unverifiedUsers,
  };
}

export async function getAdminRecentSignups(): Promise<AdminRecentSignup[]> {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: RECENT_SIGNUPS_LIMIT,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      isBlocked: true,
    },
  });
}

export async function getAdminWorkQueue(): Promise<AdminWorkQueueItem[]> {
  const since = new Date();
  since.setDate(since.getDate() - RECENT_LIVE_DAYS);

  const [businesses, reports, recentVenues, recentServices] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: { in: ["VENUE_OWNER", "FREELANCER"] },
        isBlocked: false,
        adminReviewedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: WORK_QUEUE_LIMIT,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.contentReport.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: WORK_QUEUE_LIMIT,
      select: {
        id: true,
        targetType: true,
        targetId: true,
        reason: true,
        createdAt: true,
      },
    }),
    prisma.venue.findMany({
      where: {
        moderationStatus: ListingModerationStatus.APPROVED,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.service.findMany({
      where: {
        moderationStatus: ListingModerationStatus.APPROVED,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
  ]);

  const items: AdminWorkQueueItem[] = [];

  for (const u of businesses) {
    const roleLabel =
      u.role === "VENUE_OWNER" ? "בעל/ת אולם" : "פרילנסר/ית";
    items.push({
      kind: "business",
      href: `/admin/businesses/${u.id}`,
      title: u.name?.trim() || u.email,
      subtitle: `${roleLabel} · ${u.email}`,
      meta: new Date(u.createdAt).toLocaleString("he-IL", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });
  }

  for (const r of reports) {
    items.push({
      kind: "report",
      href: `/admin/reports/${r.id}`,
      title: `דיווח: ${r.reason}`,
      subtitle: `${r.targetType} #${r.targetId}`,
      meta: new Date(r.createdAt).toLocaleString("he-IL", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });
  }

  for (const v of recentVenues) {
    items.push({
      kind: "content",
      href: `/admin/content/venue/${v.id}`,
      title: `אולם חדש: ${v.name}`,
      subtitle: "פורסם לאחרונה",
      meta: new Date(v.createdAt).toLocaleString("he-IL", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });
  }

  for (const s of recentServices) {
    items.push({
      kind: "content",
      href: `/admin/content/service/${s.id}`,
      title: `שירות חדש: ${s.name}`,
      subtitle: "פורסם לאחרונה",
      meta: new Date(s.createdAt).toLocaleString("he-IL", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });
  }

  return items.slice(0, WORK_QUEUE_LIMIT);
}
