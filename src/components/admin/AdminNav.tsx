"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Props = {
  recentLiveTotal: number;
  openReports: number;
  newBusinessUsers: number;
};

const LINKS: Array<{
  href: string;
  label: string;
  exact?: boolean;
  /** match /admin/users?focus=new-business vs all users */
  focus?: "new-business" | "none";
  badge?: "recentLive" | "reports" | "newBusiness";
}> = [
  { href: "/admin", label: "סקירה", exact: true },
  {
    href: "/admin/users?focus=new-business",
    label: "עסקים חדשים לבדיקה",
    focus: "new-business",
    badge: "newBusiness",
  },
  { href: "/admin/reports", label: "דיווחים", badge: "reports" },
  {
    href: "/admin/moderation",
    label: "תוכן באוויר",
    badge: "recentLive",
  },
  { href: "/admin/users", label: "כל המשתמשים", focus: "none" },
];

function badgeCount(
  kind: "recentLive" | "reports" | "newBusiness" | undefined,
  recentLiveTotal: number,
  openReports: number,
  newBusinessUsers: number
): number {
  if (kind === "recentLive") return recentLiveTotal;
  if (kind === "reports") return openReports;
  if (kind === "newBusiness") return newBusinessUsers;
  return 0;
}

export default function AdminNav({
  recentLiveTotal,
  openReports,
  newBusinessUsers,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const focusParam = searchParams.get("focus");

  return (
    <nav
      className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="ניווט פאנל ניהול"
    >
      {LINKS.map((item) => {
        const pathOnly = item.href.split("?")[0];
        let active = false;
        if (item.exact) {
          active = pathname === pathOnly;
        } else if (item.focus === "new-business") {
          active =
            pathname === pathOnly && focusParam === "new-business";
        } else if (item.focus === "none") {
          active =
            pathname === pathOnly && focusParam !== "new-business";
        } else {
          active =
            pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
        }

        const count = badgeCount(
          item.badge,
          recentLiveTotal,
          openReports,
          newBusinessUsers
        );
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition ${
              active
                ? "bg-amber-400 text-emerald-950 shadow-sm"
                : "border border-white/25 bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {item.label}
            {count > 0 ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  active
                    ? "bg-emerald-950 text-amber-200"
                    : "bg-amber-400 text-emerald-950"
                }`}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
