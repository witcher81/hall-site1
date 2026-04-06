"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import DevUserSwitcher from "./DevUserSwitcher";
import MessagesUnreadBadge from "./MessagesUnreadBadge";
import NotificationsUnreadBadge from "./NotificationsUnreadBadge";
import RealtimeEventBridge from "./RealtimeEventBridge";

type User = {
  id: number;
  email: string;
  name: string | null;
  role: string;
};

type Theme = "dark" | "light";

function personalAreaLinks(role: string | undefined): { href: string; label: string }[] {
  switch (role) {
    case "SEEKER":
      return [
        { href: "/favorites", label: "המועדפים שלי" },
        { href: "/my-inquiries", label: "הפניות שלי" },
        { href: "/my-service-requests", label: "הבקשות לספקים" },
        { href: "/event-planner", label: "צ׳קליסט אירוע" },
      ];
    case "VENUE_OWNER":
      return [
        { href: "/dashboard/venue-owner", label: "האולמות שלי" },
        { href: "/dashboard/venue-owner/inquiries", label: "פניות שהתקבלו" },
      ];
    case "FREELANCER":
      return [{ href: "/dashboard/freelancer", label: "השירותים שלי" }];
    default:
      return [];
  }
}

type NavKey = "halls" | "hallsMap" | "providers" | "packages" | "messages" | "notifications";

function navKeyActive(pathname: string, key: NavKey): boolean {
  if (key === "hallsMap") return pathname.startsWith("/halls/map");
  if (key === "halls") {
    if (pathname.startsWith("/halls/map")) return false;
    return pathname === "/halls" || pathname.startsWith("/halls/");
  }
  if (key === "providers")
    return pathname === "/providers" || pathname.startsWith("/providers/");
  if (key === "packages") return pathname.startsWith("/packages");
  if (key === "messages") return pathname.startsWith("/messages");
  if (key === "notifications") return pathname.startsWith("/notifications");
  return false;
}

const navLinkDesktopBase =
  "shrink-0 rounded-full px-3 py-1.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A227]";
const navLinkDesktopActive =
  "bg-[#C9A227]/25 font-semibold text-[#F5E6A8] ring-1 ring-[#C9A227]/70 shadow-[0_0_0_1px_rgba(201,162,39,0.15)]";
const navLinkDesktopIdle = "text-slate-200 hover:text-white";

const navLinkMobileBase = "block rounded-xl px-3 py-2 transition";
const navLinkMobileActive =
  "bg-[#C9A227]/15 font-semibold text-[#0F3B2E] ring-1 ring-[#C9A227]/50";
const navLinkMobileIdle = "text-[#1A1A1A] hover:bg-[#EFE6D5]";

const personalDropdownLinkBase = "block px-4 py-2.5 text-sm transition rounded-lg mx-1";
const personalDropdownLinkActive =
  "bg-[#C9A227]/15 font-semibold text-[#0F3B2E] ring-1 ring-[#C9A227]/50";
const personalDropdownLinkIdle = "text-[#1A1A1A] hover:bg-[#EFE6D5]";

/** איזה קישור באזור האישי הכי ספציפי לנתיב הנוכחי (למשל פניות לפני דשבורד האולם) */
function getActivePersonalHref(
  pathname: string,
  links: { href: string }[]
): string | null {
  if (links.length === 0) return null;
  const sorted = [...links].sort((a, b) => b.href.length - a.href.length);
  for (const { href } of sorted) {
    if (pathname === href || pathname.startsWith(`${href}/`)) return href;
  }
  return null;
}

export default function HomeHeader({
  user,
  canUseDevUserSwitcher = false,
}: {
  user: User | null;
  /** רק כשהמשתמש הוא אדמין (ADMIN_EMAILS) — מועבר מהשרת */
  canUseDevUserSwitcher?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const personalRef = useRef<HTMLDivElement | null>(null);

  const personalLinks = personalAreaLinks(user?.role);
  const activePersonalHref = useMemo(() => {
    const links = personalAreaLinks(user?.role);
    return getActivePersonalHref(pathname, links);
  }, [pathname, user?.role]);
  const canUseMessages =
    user &&
    (user.role === "SEEKER" ||
      user.role === "VENUE_OWNER" ||
      user.role === "FREELANCER");
  const canUseNotifications = Boolean(user);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("hh-theme");
    const next: Theme = stored === "light" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.body.classList.toggle("theme-light", next === "light");
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("hh-theme", next);
    }
    document.documentElement.dataset.theme = next;
    document.body.classList.toggle("theme-light", next === "light");
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (personalRef.current && !personalRef.current.contains(t)) {
        setPersonalOpen(false);
      }
    }
    if (personalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [personalOpen]);

  return (
    <header className="site-header relative z-50 border-b border-slate-800 bg-[#0F3B2E] backdrop-blur-sm">
      {user ? <RealtimeEventBridge /> : null}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 justify-start sm:gap-4">
          <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-slate-50">
            Halls Hub
          </Link>
          <Link
            href="/halls/map"
            aria-current={navKeyActive(pathname, "hallsMap") ? "page" : undefined}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] transition sm:hidden ${
              navKeyActive(pathname, "hallsMap")
                ? "border-[#C9A227] bg-[#C9A227]/20 font-semibold text-[#F5E6A8]"
                : "border-slate-600/80 text-slate-200 hover:border-slate-400 hover:text-white"
            }`}
          >
            מפה
          </Link>

          {/* ניווט אחיד: אותם פריטי בסיס לכולם; "אזור אישי" = מה שהיה תלוי־תפקיד */}
          <nav className="hidden min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 sm:flex lg:gap-x-3">
            <Link
              href="/halls"
              aria-current={navKeyActive(pathname, "halls") ? "page" : undefined}
              className={`${navLinkDesktopBase} ${
                navKeyActive(pathname, "halls")
                  ? navLinkDesktopActive
                  : navLinkDesktopIdle
              }`}
            >
              חיפוש אולמות
            </Link>
            <Link
              href="/halls/map"
              aria-current={navKeyActive(pathname, "hallsMap") ? "page" : undefined}
              className={`${navLinkDesktopBase} ${
                navKeyActive(pathname, "hallsMap")
                  ? navLinkDesktopActive
                  : navLinkDesktopIdle
              }`}
            >
              מפת אולמות
            </Link>
            <Link
              href="/providers"
              aria-current={navKeyActive(pathname, "providers") ? "page" : undefined}
              className={`${navLinkDesktopBase} ${
                navKeyActive(pathname, "providers")
                  ? navLinkDesktopActive
                  : navLinkDesktopIdle
              }`}
            >
              חיפוש ספקים
            </Link>
            <Link
              href="/packages"
              aria-current={navKeyActive(pathname, "packages") ? "page" : undefined}
              className={`${navLinkDesktopBase} ${
                navKeyActive(pathname, "packages")
                  ? navLinkDesktopActive
                  : navLinkDesktopIdle
              }`}
            >
              חבילות אירוע
            </Link>
            {user && canUseMessages && (
              <Link
                href="/messages"
                aria-current={navKeyActive(pathname, "messages") ? "page" : undefined}
                className={`relative inline-flex items-center ${navLinkDesktopBase} ${
                  navKeyActive(pathname, "messages")
                    ? navLinkDesktopActive
                    : navLinkDesktopIdle
                }`}
              >
                הודעות
                <MessagesUnreadBadge />
              </Link>
            )}
            {canUseNotifications && (
              <Link
                href="/notifications"
                aria-current={
                  navKeyActive(pathname, "notifications") ? "page" : undefined
                }
                className={`relative inline-flex items-center ${navLinkDesktopBase} ${
                  navKeyActive(pathname, "notifications")
                    ? navLinkDesktopActive
                    : navLinkDesktopIdle
                }`}
              >
                התראות
                <NotificationsUnreadBadge />
              </Link>
            )}
            {user && personalLinks.length > 0 && (
              <div className="relative" ref={personalRef}>
                <button
                  type="button"
                  onClick={() => setPersonalOpen((v) => !v)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    personalOpen
                      ? "border-[#C9A227] bg-[#C9A227] text-white shadow-sm"
                      : activePersonalHref
                        ? "border-[#C9A227]/80 bg-[#C9A227]/20 text-[#F5E6A8] ring-1 ring-[#C9A227]/50"
                        : "border-white/35 bg-white/10 text-white hover:bg-white/20"
                  }`}
                  aria-expanded={personalOpen}
                  aria-haspopup="true"
                >
                  אזור אישי
                  <svg
                    className={`h-3.5 w-3.5 opacity-80 transition-transform ${
                      personalOpen ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 7.5L10 12.5L15 7.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {personalOpen && (
                  <div className="personal-menu absolute right-0 z-[60] mt-1 min-w-[200px] rounded-2xl border border-[#E0D4C3] bg-[#FDFBF7] py-1.5 text-right shadow-xl">
                    {personalLinks.map((item) => {
                      const active = item.href === activePersonalHref;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={`${personalDropdownLinkBase} ${
                            active ? personalDropdownLinkActive : personalDropdownLinkIdle
                          }`}
                          onClick={() => setPersonalOpen(false)}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        <nav className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          {canUseDevUserSwitcher ? <DevUserSwitcher /> : null}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className={`flex max-w-[140px] items-center gap-2 truncate rounded-full px-3 py-2 text-sm font-medium transition sm:max-w-[220px] sm:px-4 ${
                  theme === "light"
                    ? "bg-amber-300 text-slate-900 hover:bg-amber-200"
                    : "bg-black/25 text-white hover:bg-black/35"
                }`}
              >
                <span className="truncate">{user.name || user.email}</span>
                <svg
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    menuOpen ? "rotate-180" : "rotate-0"
                  }`}
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {menuOpen && (
                <div className="user-menu absolute left-0 z-[60] mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#E0D4C3] bg-[#FDFBF7] p-2 text-right text-sm shadow-xl">
                  {/* במסכים צרים: הניווט המלא בתפריט המשתמש */}
                  <div className="border-b border-[#E0D4C3]/80 pb-2 sm:hidden">
                    <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#6B6560]">
                      ניווט
                    </p>
                    <Link
                      href="/halls"
                      aria-current={navKeyActive(pathname, "halls") ? "page" : undefined}
                      className={`${navLinkMobileBase} ${
                        navKeyActive(pathname, "halls")
                          ? navLinkMobileActive
                          : navLinkMobileIdle
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      חיפוש אולמות
                    </Link>
                    <Link
                      href="/halls/map"
                      aria-current={
                        navKeyActive(pathname, "hallsMap") ? "page" : undefined
                      }
                      className={`${navLinkMobileBase} ${
                        navKeyActive(pathname, "hallsMap")
                          ? navLinkMobileActive
                          : navLinkMobileIdle
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      מפת אולמות
                    </Link>
                    <Link
                      href="/providers"
                      aria-current={
                        navKeyActive(pathname, "providers") ? "page" : undefined
                      }
                      className={`${navLinkMobileBase} ${
                        navKeyActive(pathname, "providers")
                          ? navLinkMobileActive
                          : navLinkMobileIdle
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      חיפוש ספקים
                    </Link>
                    <Link
                      href="/packages"
                      aria-current={
                        navKeyActive(pathname, "packages") ? "page" : undefined
                      }
                      className={`${navLinkMobileBase} ${
                        navKeyActive(pathname, "packages")
                          ? navLinkMobileActive
                          : navLinkMobileIdle
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      חבילות אירוע
                    </Link>
                    {canUseMessages && (
                      <Link
                        href="/messages"
                        aria-current={
                          navKeyActive(pathname, "messages") ? "page" : undefined
                        }
                        className={`relative inline-flex items-center ${navLinkMobileBase} ${
                          navKeyActive(pathname, "messages")
                            ? navLinkMobileActive
                            : navLinkMobileIdle
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        הודעות
                        <MessagesUnreadBadge />
                      </Link>
                    )}
                    {canUseNotifications && (
                      <Link
                        href="/notifications"
                        aria-current={
                          navKeyActive(pathname, "notifications")
                            ? "page"
                            : undefined
                        }
                        className={`relative inline-flex items-center ${navLinkMobileBase} ${
                          navKeyActive(pathname, "notifications")
                            ? navLinkMobileActive
                            : navLinkMobileIdle
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        התראות
                        <NotificationsUnreadBadge />
                      </Link>
                    )}
                  </div>
                  {personalLinks.length > 0 && (
                    <div className="border-b border-[#E0D4C3]/80 py-2 sm:hidden">
                      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#6B6560]">
                        אזור אישי
                      </p>
                      {personalLinks.map((item) => {
                        const active = item.href === activePersonalHref;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={`${navLinkMobileBase} ${
                              active ? navLinkMobileActive : navLinkMobileIdle
                            }`}
                            onClick={() => setMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                  <Link
                    href="/settings"
                    aria-current={
                      pathname.startsWith("/settings") ? "page" : undefined
                    }
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 ${
                      pathname.startsWith("/settings")
                        ? navLinkMobileActive
                        : "text-[#1A1A1A] hover:bg-[#EFE6D5]"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>הגדרות</span>
                  </Link>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-[#1A1A1A] hover:bg-[#EFE6D5]"
                  >
                    <span>מצב תצוגה</span>
                    <span
                      className={`flex h-6 w-12 items-center rounded-full px-1 text-[10px] font-medium transition-colors ${
                        theme === "dark"
                          ? "justify-start bg-slate-700 text-slate-100"
                          : "justify-end bg-amber-300 text-amber-900"
                      }`}
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] text-slate-900 shadow-sm">
                        {theme === "dark" ? "☾" : "☼"}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-red-300 hover:bg-red-500/10"
                  >
                    <span>התנתקות</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <a
                href="/auth/login"
                className="rounded-full border border-white/30 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 sm:px-4"
              >
                התחברות
              </a>
              <a
                href="/auth/register"
                className="rounded-full bg-[#C9A227] px-3 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition hover:bg-[#E5C96B] sm:px-4"
              >
                הרשמה
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
