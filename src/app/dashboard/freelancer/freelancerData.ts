import { prisma } from "@/lib/prisma";
import {
  countUnreadMessagesTotal,
  countUnreadNotifications,
} from "@/lib/unreadCounts";
import { isFreelancerBusinessProfileIncomplete } from "@/lib/businessProfile";
import { serviceRequestStatusLabel } from "@/lib/serviceRequestStatus";
import {
  getServiceListingReadiness,
  type ServiceReadinessCheck,
} from "@/lib/serviceListingReadiness";
import type {
  DashboardActivityItem,
  DashboardAttentionItem,
  DashboardKpi,
  DashboardQuickAction,
} from "@/components/dashboard/businessDashboardTypes";
import { formatDashboardDate } from "@/components/dashboard/businessDashboardTypes";

export type FreelancerOnboardingChecklist = {
  percent: number;
  doneCount: number;
  total: number;
  items: Array<{ id: string; label: string; done: boolean; href: string }>;
};

function profilePhoneOk(dbUser: {
  phone: string | null;
  businessPhone: string | null;
}): boolean {
  return Boolean(dbUser.businessPhone?.trim() || dbUser.phone?.trim());
}

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
      subtitle: "חסרים שם מותג או טלפון — נדרשים לניהול החשבון ולפניות דרך האתר",
      href: "/dashboard/freelancer/profile",
      badge: "פרופיל",
      tone: "amber",
    });
  }

  const primaryService = services[0] ?? null;
  const serviceReady = primaryService
    ? getServiceListingReadiness(primaryService)
    : null;
  const incompleteServices = services.filter(
    (s) => !getServiceListingReadiness(s).ready
  );
  if (incompleteServices.length > 0) {
    const first = incompleteServices[0];
    attention.push({
      id: "service-mvp-incomplete",
      title:
        incompleteServices.length === 1
          ? `השלימו את «${first.name}» לפרסום`
          : `${incompleteServices.length} שירותים ממתינים להשלמה`,
      subtitle:
        "נדרשים: קטגוריה, אזור שירות, מחיר/חבילה, תמונה ראשית ותיאור קצר",
      href: `/dashboard/freelancer/services/${first.id}/edit`,
      badge: "פרסום",
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

  const publishedCount = services.filter(
    (s) => s.moderationStatus === "APPROVED"
  ).length;

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
      label: "שירותים מפורסמים",
      value: publishedCount,
      href: "/dashboard/freelancer/services",
      hint:
        services.length > publishedCount
          ? `${services.length - publishedCount} בהשלמה`
          : undefined,
      tone: "emerald",
    },
  ];

  const quickActions: DashboardQuickAction[] = [
    {
      href: "/dashboard/freelancer/services/new",
      label: "הוספת שירות חדש",
      primary: true,
    },
    { href: "/dashboard/freelancer/services", label: "השירותים שלי" },
    { href: "/dashboard/freelancer/requests", label: "כל הבקשות" },
    { href: "/messages", label: "הודעות" },
    { href: "/notifications", label: "התראות" },
    { href: "/dashboard/freelancer/profile", label: "פרופיל ספק" },
  ];

  const brandOk = Boolean(dbUser?.businessName?.trim());
  const phoneOk = dbUser ? profilePhoneOk(dbUser) : false;
  const hasService = services.length > 0;
  const serviceChecks: ServiceReadinessCheck[] = serviceReady?.checks ?? [
    { id: "category", label: "קטגוריית שירות", done: false },
    { id: "serviceArea", label: "אזור שירות", done: false },
    { id: "price", label: "מחיר או חבילה אחת לפחות", done: false },
    { id: "coverImage", label: "תמונה ראשית", done: false },
    { id: "description", label: "תיאור קצר", done: false },
  ];
  const serviceEditHref = primaryService
    ? `/dashboard/freelancer/services/${primaryService.id}/edit`
    : "/dashboard/freelancer/services/new";

  const onboardingItems: FreelancerOnboardingChecklist["items"] = [
    {
      id: "brand",
      label: "שם מותג / עסק",
      done: brandOk,
      href: "/dashboard/freelancer/profile",
    },
    {
      id: "phone",
      label: "טלפון ליצירת קשר",
      done: phoneOk,
      href: "/dashboard/freelancer/profile",
    },
    {
      id: "service",
      label: "שירות אחד לפחות",
      done: hasService,
      href: "/dashboard/freelancer/services/new",
    },
    ...serviceChecks.map((c) => ({
      id: c.id,
      label: c.label,
      done: hasService && c.done,
      href: serviceEditHref,
    })),
  ];
  const onboardingDone = onboardingItems.filter((i) => i.done).length;
  const onboarding: FreelancerOnboardingChecklist = {
    items: onboardingItems,
    doneCount: onboardingDone,
    total: onboardingItems.length,
    percent: Math.round((onboardingDone / onboardingItems.length) * 100),
  };

  return {
    dbUser,
    services,
    profileIncomplete,
    onboarding,
    stats: {
      newRequestCount,
      openRequestCount,
      unreadMessages,
      unreadNotifications,
      serviceCount: services.length,
      publishedCount,
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
