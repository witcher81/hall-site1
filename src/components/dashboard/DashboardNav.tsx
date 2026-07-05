"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DASHBOARD_NAV,
  type DashboardRole,
} from "@/components/dashboard/dashboardNavConfig";
import ThemeToggle from "@/components/ThemeToggle";
import { useHeaderThemeToggleVisible } from "@/lib/useThemeToggleDock";

type User = { name: string | null; email: string } | null;

export default function DashboardNav({
  role,
  user,
}: {
  role: DashboardRole;
  user: User;
}) {
  const pathname = usePathname();
  const config = DASHBOARD_NAV[role];
  const displayName = user?.name?.trim() || user?.email || "";
  const showHeaderThemeToggle = useHeaderThemeToggleVisible();

  return (
    <header className="dashboard-nav sticky top-0 z-[500] backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-white transition hover:text-amber-300"
            >
              Halls Hub
            </Link>
            <span className="dashboard-nav-badge">{config.badge}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {showHeaderThemeToggle ? <ThemeToggle variant="header" /> : null}
            {displayName ? (
              <span
                className="hidden max-w-[12rem] truncate text-xs text-white/75 sm:inline sm:text-sm"
                title={displayName}
              >
                {displayName}
              </span>
            ) : null}
            <Link href="/" className="dashboard-nav-home">
              דף הבית
            </Link>
          </div>
        </div>

        <nav
          className="-mx-1 flex gap-1 overflow-x-auto pb-3.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="ניווט אזור אישי"
        >
          {config.links.map((item) => {
            const isActive = item.isActive(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive ? "dashboard-nav-link dashboard-nav-link-active" : "dashboard-nav-link"
                }
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
