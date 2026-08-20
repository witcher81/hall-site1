"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  pendingTotal: number;
  openReports: number;
  newBusinessUsers: number;
};

const LINKS: Array<{
  href: string;
  label: string;
  exact?: boolean;
  badge?: "pending" | "reports" | "newBusiness";
}> = [
  { href: "/admin", label: "סקירה", exact: true },
  {
    href: "/admin/users?focus=new-business",
    label: "משתמשים חדשים",
    badge: "newBusiness",
  },
  { href: "/admin/reports", label: "דיווחים", badge: "reports" },
  { href: "/admin/moderation", label: "בקרת תוכן", badge: "pending" },
  { href: "/admin/users", label: "כל המשתמשים" },
];

function badgeCount(
  kind: "pending" | "reports" | "newBusiness" | undefined,
  pendingTotal: number,
  openReports: number,
  newBusinessUsers: number
): number {
  if (kind === "pending") return pendingTotal;
  if (kind === "reports") return openReports;
  if (kind === "newBusiness") return newBusinessUsers;
  return 0;
}

export default function AdminNav({
  pendingTotal,
  openReports,
  newBusinessUsers,
}: Props) {
  const pathname = usePathname();

  return (
    <nav
      className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="ניווט פאנל ניהול"
    >
      {LINKS.map((item) => {
        const pathOnly = item.href.split("?")[0];
        const active = item.exact
          ? pathname === pathOnly
          : pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
        const count = badgeCount(
          item.badge,
          pendingTotal,
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
