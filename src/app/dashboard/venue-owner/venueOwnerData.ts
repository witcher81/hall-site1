import { prisma } from "@/lib/prisma";
import {
  countUnreadMessagesTotal,
  countUnreadNotifications,
} from "@/lib/unreadCounts";
import { isVenueOwnerBusinessProfileIncomplete } from "@/lib/businessProfile";
import type {
  DashboardActivityItem,
  DashboardAttentionItem,
  DashboardKpi,
  DashboardQuickAction,
} from "@/components/dashboard/businessDashboardTypes";
import { formatDashboardDate } from "@/components/dashboard/businessDashboardTypes";

const INQUIRY_STATUS: Record<string, string> = {
  NEW: "חדשה",
  READ: "נצפתה",
  REPLIED: "נענתה",
  APPROVED: "אושרה",
  REJECTED: "נדחתה",
  CANCELLED: "בוטלה",
};

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

  const [
    recentInquiries,
    openInquiryCount,
    newInquiryCount,
    packageCount,
    unreadMessages,
    unreadNotifications,
    recentNotifications,
    needsReplyInquiries,
  ] = await Promise.all([
    venueIds.length === 0
      ? Promise.resolve([])
      : prisma.inquiry.findMany({
          where: { venueId: { in: venueIds } },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: {
            venue: { select: { id: true, name: true } },
            user: { select: { name: true, email: true } },
          },
        }),
    venueIds.length === 0
      ? Promise.resolve(0)
      : prisma.inquiry.count({
          where: {
            venueId: { in: venueIds },
            status: { in: ["NEW", "READ"] },
          },
        }),
    venueIds.length === 0
      ? Promise.resolve(0)
      : prisma.inquiry.count({
          where: { venueId: { in: venueIds }, status: "NEW" },
        }),
    venueIds.length === 0
      ? Promise.resolve(0)
      : prisma.eventPackage.count({
          where: { venueId: { in: venueIds } },
        }),
    countUnreadMessagesTotal(ownerId),
    countUnreadNotifications(ownerId),
    prisma.notification.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        body: true,
        href: true,
        isRead: true,
        createdAt: true,
      },
    }),
    venueIds.length === 0
      ? Promise.resolve([])
      : prisma.inquiry.findMany({
          where: {
            venueId: { in: venueIds },
            status: { in: ["NEW", "READ"] },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
          include: {
            venue: { select: { id: true, name: true } },
            user: { select: { name: true, email: true } },
          },
        }),
  ]);

  const profileIncomplete = dbUser
    ? isVenueOwnerBusinessProfileIncomplete(dbUser)
    : true;

  const attention: DashboardAttentionItem[] = [];

  if (profileIncomplete) {
    attention.push({
      id: "profile-incomplete",
      title: "השלימו את הפרופיל העסקי",
      subtitle: "חסרים פרטי קשר או שם עסק — מחפשים רואים פרופיל חלקי",
      href: "/dashboard/venue-owner/profile",
      badge: "פרופיל",
      tone: "amber",
    });
  }

  if (unreadMessages > 0) {
    attention.push({
      id: "unread-messages",
      title: `${unreadMessages} הודעות שלא נקראו`,
      subtitle: "פתחו את תיבת ההודעות כדי להשיב ללקוחות",
      href: "/messages",
      badge: "הודעות",
      tone: "rose",
    });
  }

  if (unreadNotifications > 0) {
    attention.push({
      id: "unread-notifications",
      title: `${unreadNotifications} התראות חדשות`,
      subtitle: "עדכונים על פניות, סטטוסים ופעילות בחשבון",
      href: "/notifications",
      badge: "התראות",
      tone: "amber",
    });
  }

  for (const q of needsReplyInquiries) {
    attention.push({
      id: `inquiry-${q.id}`,
      title: `פנייה ל${q.venue.name}`,
      subtitle: q.user.name?.trim() || q.user.email,
      meta: formatDashboardDate(q.createdAt.toISOString()),
      href: `/dashboard/venue-owner/inquiries/${q.id}`,
      badge: INQUIRY_STATUS[q.status] ?? q.status,
      tone: q.status === "NEW" ? "amber" : "neutral",
    });
  }

  const rejectedVenues = venues.filter((v) => v.moderationStatus === "REJECTED");
  for (const v of rejectedVenues.slice(0, 3)) {
    attention.push({
      id: `venue-rejected-${v.id}`,
      title: `האולם «${v.name}» הוסר מהאוויר`,
      subtitle: v.moderationNote?.trim() || "בדקו את ההערה ועדכנו את הפרסום",
      href: `/dashboard/venue-owner/venues/${v.id}`,
      badge: "הוסר",
      tone: "rose",
    });
  }

  const activity: DashboardActivityItem[] = [
    ...recentInquiries.slice(0, 5).map((q) => ({
      id: `act-inquiry-${q.id}`,
      title: `פנייה · ${q.venue.name}`,
      subtitle: q.user.name?.trim() || q.user.email,
      meta: formatDashboardDate(q.createdAt.toISOString()),
      href: `/dashboard/venue-owner/inquiries/${q.id}`,
      badge: INQUIRY_STATUS[q.status] ?? q.status,
    })),
    ...recentNotifications.slice(0, 3).map((n) => ({
      id: `act-notif-${n.id}`,
      title: n.title,
      subtitle: n.body ?? undefined,
      meta: formatDashboardDate(n.createdAt.toISOString()),
      href: n.href || "/notifications",
      badge: n.isRead ? "נקרא" : "חדש",
    })),
  ].slice(0, 8);

  const kpis: DashboardKpi[] = [
    {
      label: "פניות חדשות",
      value: newInquiryCount,
      href: "/dashboard/venue-owner/inquiries",
      hint: openInquiryCount > 0 ? `${openInquiryCount} ממתינות לתגובה` : undefined,
      tone: newInquiryCount > 0 ? "amber" : "default",
    },
    {
      label: "הודעות שלא נקראו",
      value: unreadMessages,
      href: "/messages",
      tone: unreadMessages > 0 ? "rose" : "default",
    },
    {
      label: "התראות",
      value: unreadNotifications,
      href: "/notifications",
      tone: unreadNotifications > 0 ? "amber" : "default",
    },
    {
      label: "אולמות פעילים",
      value: venues.length,
      href: "/dashboard/venue-owner",
      hint: packageCount > 0 ? `${packageCount} חבילות` : "אין חבילות עדיין",
      tone: "emerald",
    },
  ];

  const quickActions: DashboardQuickAction[] = [
    {
      href: "/dashboard/venue-owner/venues/new",
      label: "יצירת אולם חדש",
      primary: true,
    },
    { href: "/dashboard/venue-owner/inquiries", label: "כל הפניות" },
    { href: "/messages", label: "הודעות" },
    { href: "/notifications", label: "התראות" },
    { href: "/dashboard/venue-owner/packages", label: "חבילות" },
    { href: "/dashboard/venue-owner/profile", label: "פרופיל עסקי" },
  ];

  return {
    dbUser,
    venues,
    profileIncomplete,
    stats: {
      newInquiryCount,
      openInquiryCount,
      packageCount,
      unreadMessages,
      unreadNotifications,
      venueCount: venues.length,
    },
    kpis,
    attention: attention.slice(0, 10),
    activity,
    quickActions,
    recentInquiries: recentInquiries.map((q) => ({
      ...q,
      createdAt: q.createdAt.toISOString(),
      repliedAt: q.repliedAt ? q.repliedAt.toISOString() : null,
    })),
  };
}
