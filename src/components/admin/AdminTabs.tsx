"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminTab = {
  href: string;
  label: string;
  badge?: number;
  /** exact match only (for /admin home) */
  exact?: boolean;
};

type Props = {
  tabs: AdminTab[];
  secondaryHref?: string;
  secondaryLabel?: string;
};

export default function AdminTabs({
  tabs,
  secondaryHref,
  secondaryLabel,
}: Props) {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap items-center gap-2"
      aria-label="ניווט פאנל ניהול"
    >
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-emerald-950 text-white shadow-sm"
                : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  active ? "bg-amber-400 text-emerald-950" : "bg-amber-100 text-amber-950"
                }`}
              >
                {tab.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
      {secondaryHref && secondaryLabel ? (
        <Link
          href={secondaryHref}
          aria-current={
            pathname === secondaryHref || pathname.startsWith(`${secondaryHref}/`)
              ? "page"
              : undefined
          }
          className={`mr-auto text-sm font-medium underline-offset-2 hover:underline ${
            pathname === secondaryHref || pathname.startsWith(`${secondaryHref}/`)
              ? "text-emerald-950"
              : "text-neutral-600"
          }`}
        >
          {secondaryLabel}
        </Link>
      ) : null}
    </nav>
  );
}
