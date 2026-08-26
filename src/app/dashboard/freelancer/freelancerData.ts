import { prisma } from "@/lib/prisma";
import {
  countUnreadMessagesTotal,
  countUnreadNotifications,
} from "@/lib/unreadCounts";
import { isFreelancerBusinessProfileIncomplete } from "@/lib/businessProfile";
import { serviceRequestStatusLabel } from "@/lib/serviceRequestStatus";
import type {
  DashboardActivityItem,
  DashboardAttentionItem,
  DashboardKpi,
  DashboardQuickAction,
} from "@/components/dashboard/businessDashboardTypes";
import { formatDashboardDate } from "@/components/dashboard/businessDashboardTypes";

export async function getFreelancerDashboardData(providerId: number) {
  const [dbUser, services] = await Promise.all([
    prisma.user.findUnique({
      where: { id: providerId },
      select: {
        name: true,
        email: true,
        phone: true,
        businessName: true,
        businessPhone: true,
        profileImageUrl: true,
        businessBio: true,
      },
    }),
    prisma.service.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serviceIds = services.map((s) => s.id);

  const [
    recentRequests,
    openRequestCount,
    newRequestCount,
    unreadMessages,
    unreadNotifications,
    recentNotifications,
    needsReplyRequests,
  ] = await Promise.all([
    serviceIds.length === 0
      ? Promise.resolve([])
      : prisma.serviceRequest.findMany({
          where: { serviceId: { in: serviceIds } },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: {
            user: { select: { name: true, email: true } },
            service: { select: { id: true, name: true } },
          },
        }),
    serviceIds.length === 0
      ? Promise.resolve(0)
      : prisma.serviceRequest.count({
          where: {
            serviceId: { in: serviceIds },
            status: { in: ["NEW", "READ"] },
          },
        }),
    serviceIds.length === 0
      ? Promise.resolve(0)
      : prisma.serviceRequest.count({
          where: { serviceId: { in: serviceIds }, status: "NEW" },
        }),
    countUnreadMessagesTotal(providerId),
    countUnreadNotifications(providerId),
    prisma.notification.findMany({
      where: { userId: providerId },
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
    serviceIds.length === 0
      ? Promise.resolve([])
      : prisma.serviceRequest.findMany({
          where: {
            serviceId: { in: serviceIds },
            status: { in: ["NEW", "READ"] },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
          include: {
            user: { select: { name: true, email: true } },
            service: { select: { id: true, name: true } },
          },
        }),
  ]);

  const profileIncomplete = dbUser
    ? isFreelancerBusinessProfileIncomplete(dbUser)
    : true;

  const attention: DashboardAttentionItem[] = [];

  if (profileIncomplete) {
    attention.push({
      id: "profile-incomplete",
      title: "השלימו את פרופיל הספק",
      subtitle: "חסרים שם מותג או טלפון — מחפשים רואים פרטים חלקיים",
      href: "/dashboard/freelancer/profile",
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
      subtitle: "עדכונים על בקשות ופעילות בחשבון",
      href: "/notifications",
      badge: "התראות",
      tone: "amber",
    });
  }

  for (const r of needsReplyRequests) {
    attention.push({
      id: `request-${r.id}`,
      title: `בקשה ל«${r.service.name}»`,
      subtitle: r.user.name?.trim() || r.user.email,
      meta: formatDashboardDate(r.createdAt.toISOString()),
      href: `/dashboard/freelancer/requests?requestId=${r.id}`,
      badge: serviceRequestStatusLabel(r.status),
      tone: r.status === "NEW" ? "amber" : "neutral",
    });
  }

  const rejectedServices = services.filter(
    (s) => s.moderationStatus === "REJECTED"
  );
  for (const s of rejectedServices.slice(0, 3)) {
    attention.push({
      id: `service-rejected-${s.id}`,
      title: `השירות «${s.name}» הוסר מהאוויר`,
      subtitle: s.moderationNote?.trim() || "בדקו את ההערה ועדכנו את הפרסום",
      href: `/dashboard/freelancer/services/${s.id}`,
      badge: "הוסר",
      tone: "rose",
    });
  }

  const activity: DashboardActivityItem[] = [
    ...recentRequests.slice(0, 5).map((r) => ({
      id: `act-request-${r.id}`,
      title: `בקשה · ${r.service.name}`,
      subtitle: r.user.name?.trim() || r.user.email,
      meta: formatDashboardDate(r.createdAt.toISOString()),
      href: `/dashboard/freelancer/requests?requestId=${r.id}`,
      badge: serviceRequestStatusLabel(r.status),
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
      label: "בקשות חדשות",
      value: newRequestCount,
      href: "/dashboard/freelancer/requests",
      hint:
        openRequestCount > 0
          ? `${openRequestCount} ממתינות לתגובה`
          : undefined,
      tone: newRequestCount > 0 ? "amber" : "default",
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
      label: "שירותים פעילים",
      value: services.length,
      href: "/dashboard/freelancer",
      tone: "emerald",
    },
  ];

  const quickActions: DashboardQuickAction[] = [
    {
      href: "/dashboard/freelancer/services/new",
      label: "הוספת שירות חדש",
      primary: true,
    },
    { href: "/dashboard/freelancer/requests", label: "כל הבקשות" },
    { href: "/messages", label: "הודעות" },
    { href: "/notifications", label: "התראות" },
    { href: "/dashboard/freelancer/profile", label: "פרופיל ספק" },
  ];

  return {
    dbUser,
    services,
    profileIncomplete,
    stats: {
      newRequestCount,
      openRequestCount,
      unreadMessages,
      unreadNotifications,
      serviceCount: services.length,
    },
    kpis,
    attention: attention.slice(0, 10),
    activity,
    quickActions,
    recentRequests: recentRequests.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      repliedAt: r.repliedAt ? r.repliedAt.toISOString() : null,
    })),
  };
}
