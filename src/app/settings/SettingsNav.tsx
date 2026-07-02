"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/settings/profile", label: "פרופיל" },
  { href: "/settings/security", label: "אבטחה" },
  { href: "/settings/privacy", label: "פרטיות" },
  { href: "/settings/notifications", label: "התראות" },
  { href: "/settings/legal", label: "מסמכים" },
  { href: "/settings/account", label: "חשבון" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="קטגוריות הגדרות"
      className="flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,59,46,0.08)]"
    >
      {SECTIONS.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition ${
              active
                ? "border-emerald-800 bg-emerald-950 text-white"
                : "border-neutral-300 bg-[#f7f3eb] text-emerald-950 hover:border-amber-400 hover:bg-amber-50"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
