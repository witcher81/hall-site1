"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminNavItem } from "@/lib/adminUi";

type Props = {
  adminName: string;
  items: AdminNavItem[];
};

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar({ adminName, items }: Props) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <p className="admin-sidebar__brand-title">EventForYou</p>
        <p className="admin-sidebar__brand-sub">פאנל ניהול · {adminName}</p>
      </div>

      <nav className="admin-nav" aria-label="ניווט פאנל ניהול">
        {items.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`admin-nav__link${active ? " is-active" : ""}`}
            >
              <span>{item.label}</span>
              {item.badge != null && item.badge > 0 ? (
                <span className="admin-nav__badge">{item.badge}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar__footer">
        <Link href="/" className="admin-sidebar__back">
          <span aria-hidden>→</span>
          חזרה לאתר הציבורי
        </Link>
      </div>
    </aside>
  );
}
