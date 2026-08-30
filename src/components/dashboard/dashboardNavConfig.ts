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
    // ניווט הפאנל (quick actions / תוכן) — בלי כפילות בבר העליון
    links: [],
  },
  "venue-owner": {
    role: "venue-owner",
    badge: "אזור בעל אולם",
    base: "/dashboard/venue-owner",
    links: [],
  },
};
