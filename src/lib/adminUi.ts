import type { AdminDashboardStats } from "@/lib/adminDashboardStats";

export type AdminNavItem = {
  href: string;
  label: string;
  badge?: number;
  exact?: boolean;
};

/** @deprecated use AdminNavItem */
export type AdminTab = AdminNavItem;

export function buildAdminNav(stats: AdminDashboardStats): AdminNavItem[] {
  return [
    { href: "/admin", label: "סקירה", exact: true },
    {
      href: "/admin/users",
      label: "משתמשים",
      badge: stats.newUsersThisWeek > 0 ? stats.newUsersThisWeek : undefined,
    },
    {
      href: "/admin/businesses",
      label: "עסקים חדשים",
      badge: stats.newBusinessUsers,
    },
    {
      href: "/admin/content",
      label: "תוכן באוויר",
      badge: stats.pendingTotal > 0 ? stats.pendingTotal : undefined,
    },
    {
      href: "/admin/reports",
      label: "דיווחים",
      badge: stats.openReports,
    },
  ];
}

/** @deprecated use buildAdminNav */
export function buildAdminTabs(stats: AdminDashboardStats): AdminNavItem[] {
  return buildAdminNav(stats);
}

export const ROLE_LABELS: Record<string, string> = {
  SEEKER: "מחפש/ת",
  VENUE_OWNER: "בעל/ת אולם",
  FREELANCER: "פרילנסר/ית",
};

export function roleTagClass(role: string): string {
  if (role === "SEEKER") return "admin-tag--seeker";
  if (role === "VENUE_OWNER") return "admin-tag--venue";
  if (role === "FREELANCER") return "admin-tag--freelancer";
  return "admin-tag--seeker";
}

export const MODERATION_STATUS_HE: Record<string, string> = {
  APPROVED: "באוויר",
  PENDING: "ממתין",
  REJECTED: "הוסר",
};

export const REPORT_STATUS_HE: Record<string, string> = {
  OPEN: "פתוח",
  RESOLVED: "טופל",
  DISMISSED: "נדחה",
};

export const TARGET_TYPE_HE: Record<string, string> = {
  venue: "אולם",
  service: "שירות",
  provider: "ספק",
};

export function publicTargetHref(
  targetType: string,
  targetId: number
): string | null {
  if (targetType === "venue") return `/halls/${targetId}`;
  if (targetType === "service") return `/services/${targetId}`;
  if (targetType === "provider") return `/providers/${targetId}`;
  return null;
}

export function adminContentHref(
  listingType: "VENUE" | "SERVICE",
  id: number
): string {
  return listingType === "VENUE"
    ? `/admin/content/venue/${id}`
    : `/admin/content/service/${id}`;
}
