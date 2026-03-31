"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type User = { name: string | null; email: string } | null;

/** אותה שפה כמו ניווט בעל אולם + כותרת האתר */
export default function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname();
  const base = "/dashboard/freelancer";

  const link = (href: string, label: string) => {
    const isActive =
      href === base
        ? pathname === base || pathname.startsWith(base + "/services")
        : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={
          isActive
            ? "rounded-full bg-[#C9A227] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
            : "rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-[#F8F6F0] transition hover:border-white/50 hover:bg-white/10"
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="site-header border-b border-white/10 bg-[#0F3B2E] backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-white hover:text-[#E5C96B]"
          >
            Halls Hub
          </Link>
          <span className="hidden text-white/35 sm:inline">|</span>
          <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-[#C9A227] sm:inline">
            אזור ספק
          </span>
          {link(base, "השירותים שלי")}
          {link(base + "/requests", "בקשות שהתקבלו")}
          {link(base + "/profile", "פרופיל")}
          <Link
            href="/"
            className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-[#F8F6F0] transition hover:bg-white/10"
          >
            דף הבית
          </Link>
        </nav>
        {user && (
          <span className="max-w-[min(100%,14rem)] truncate text-xs text-[#E8E4DC] sm:text-sm">
            {user.name || user.email}
          </span>
        )}
      </div>
    </header>
  );
}
