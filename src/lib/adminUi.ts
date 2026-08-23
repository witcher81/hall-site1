import type { AdminTab } from "@/components/admin/AdminTabs";
import type { AdminDashboardStats } from "@/lib/adminDashboardStats";

export function buildAdminTabs(stats: AdminDashboardStats): AdminTab[] {
  return [
    { href: "/admin", label: "תור עבודה", exact: true },
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

export const ROLE_LABELS: Record<string, string> = {
  SEEKER: "מחפש/ת",
  VENUE_OWNER: "בעל/ת אולם",
  FREELANCER: "פרילנסר/ית",
};

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
