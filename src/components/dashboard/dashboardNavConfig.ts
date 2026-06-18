export type DashboardRole = "freelancer" | "venue-owner";

export type DashboardNavItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

export type DashboardNavConfig = {
  role: DashboardRole;
  badge: string;
  base: string;
  links: DashboardNavItem[];
};

export const DASHBOARD_NAV: Record<DashboardRole, DashboardNavConfig> = {
  freelancer: {
    role: "freelancer",
    badge: "אזור ספק",
    base: "/dashboard/freelancer",
    links: [
      {
        href: "/dashboard/freelancer",
        label: "השירותים שלי",
        isActive: (pathname) =>
          pathname === "/dashboard/freelancer" ||
          pathname.startsWith("/dashboard/freelancer/services"),
      },
      {
        href: "/dashboard/freelancer/requests",
        label: "בקשות שהתקבלו",
        isActive: (pathname) =>
          pathname.startsWith("/dashboard/freelancer/requests"),
      },
      {
        href: "/dashboard/freelancer/profile",
        label: "פרופיל",
        isActive: (pathname) =>
          pathname.startsWith("/dashboard/freelancer/profile"),
      },
      {
        href: "/messages",
        label: "הודעות",
        isActive: (pathname) => pathname.startsWith("/messages"),
      },
    ],
  },
  "venue-owner": {
    role: "venue-owner",
    badge: "אזור בעל אולם",
    base: "/dashboard/venue-owner",
    links: [
      {
        href: "/dashboard/venue-owner",
        label: "האולמות שלי",
        isActive: (pathname) =>
          pathname === "/dashboard/venue-owner" ||
          pathname.startsWith("/dashboard/venue-owner/venues"),
      },
      {
        href: "/dashboard/venue-owner/inquiries",
        label: "פניות",
        isActive: (pathname) =>
          pathname.startsWith("/dashboard/venue-owner/inquiries"),
      },
      {
        href: "/dashboard/venue-owner/packages",
        label: "חבילות",
        isActive: (pathname) =>
          pathname.startsWith("/dashboard/venue-owner/packages"),
      },
      {
        href: "/dashboard/venue-owner/profile",
        label: "פרופיל",
        isActive: (pathname) =>
          pathname.startsWith("/dashboard/venue-owner/profile"),
      },
      {
        href: "/messages",
        label: "הודעות",
        isActive: (pathname) => pathname.startsWith("/messages"),
      },
    ],
  },
};
