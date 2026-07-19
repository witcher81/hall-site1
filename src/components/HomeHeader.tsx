"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DevUserSwitcher from "./DevUserSwitcher";
import MessagesUnreadBadge from "./MessagesUnreadBadge";
import NotificationsUnreadBadge from "./NotificationsUnreadBadge";
import RealtimeEventBridge from "./RealtimeEventBridge";
import ThemeToggle from "./ThemeToggle";
import { useSiteTheme } from "./ThemeProvider";
import { useHeaderThemeToggleVisible } from "@/lib/useThemeToggleDock";

type User = {
  id: number;
  email: string;
  name: string | null;
  role: string;
};

function personalAreaLinks(role: string | undefined): { href: string; label: string }[] {
  switch (role) {
    case "SEEKER":
      return [
        { href: "/dashboard/seeker", label: "האזור האישי" },
        { href: "/favorites", label: "המועדפים שלי" },
        { href: "/my-inquiries", label: "הפניות שלי" },
        { href: "/my-service-requests", label: "הבקשות לספקים" },
        { href: "/event-tools", label: "כלי תכנון אירוע" },
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

type NavKey =
  | "halls"
  | "providers"
  | "packages"
  | "favorites"
  | "eventTools"
  | "messages"
  | "notifications";

function navKeyActive(pathname: string, key: NavKey): boolean {
  if (key === "halls") {
    return pathname === "/halls" || pathname.startsWith("/halls/");
  }
  if (key === "providers")
    return pathname === "/providers" || pathname.startsWith("/providers/");
  if (key === "packages") return pathname.startsWith("/packages");
  if (key === "favorites") return pathname.startsWith("/favorites");
  if (key === "eventTools") {
    return (
      pathname.startsWith("/event-tools") ||
      pathname.startsWith("/my-plans") ||
      pathname.startsWith("/event-planner") ||
      pathname.startsWith("/event-builder")
    );
  }
  if (key === "messages") return pathname.startsWith("/messages");
  if (key === "notifications") return pathname.startsWith("/notifications");
  return false;
}

const navLinkDesktopBase =
  "shrink-0 whitespace-nowrap rounded-full px-2 py-1.5 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A227] xl:px-3 xl:text-sm";
const navLinkDesktopActive =
  "bg-amber-400/25 font-semibold text-[#F5E6A8] ring-1 ring-amber-400/70 shadow-[0_0_0_1px_rgba(201,162,39,0.15)]";
const navLinkDesktopIdle = "text-slate-200 hover:text-white";

const navLinkMobileBase = "block rounded-xl px-3 py-2 transition";
const navLinkMobileActive =
  "bg-amber-400/15 font-semibold text-emerald-950 ring-1 ring-amber-400/50";
const navLinkMobileIdle = "text-neutral-900 hover:bg-neutral-50";

const personalDropdownLinkBase = "block px-4 py-2.5 text-sm transition rounded-lg mx-1";
const personalDropdownLinkActive =
  "bg-amber-400/15 font-semibold text-emerald-950 ring-1 ring-amber-400/50";
const personalDropdownLinkIdle = "text-neutral-900 hover:bg-neutral-50";

/** איזה קישור באזור האישי הכי ספציפי לנתיב הנוכחי (למשל פניות לפני דשבורד האולם) */
function getActivePersonalHref(
  pathname: string,
  links: { href: string }[]
): string | null {
  if (links.length === 0) return null;
  const isPlanningToolPath =
    pathname.startsWith("/event-tools") ||
    pathname.startsWith("/my-plans") ||
    pathname.startsWith("/event-planner") ||
    pathname.startsWith("/event-builder");
  if (isPlanningToolPath && links.some((l) => l.href === "/event-tools")) {
    return "/event-tools";
  }
  const sorted = [...links].sort((a, b) => b.href.length - a.href.length);
  for (const { href } of sorted) {
    if (pathname === href || pathname.startsWith(`${href}/`)) return href;
  }
  return null;
}

type DevSwitcherUserRow = {
  id: number;
  name: string | null;
  email: string;
  role: string;
};

export default function HomeHeader({
  user,
  canUseDevUserSwitcher = false,
  devSwitcherUsers,
  devSwitcherCanCreate = false,
  isAdmin = false,
}: {
  user: User | null;
  canUseDevUserSwitcher?: boolean;
  devSwitcherUsers?: DevSwitcherUserRow[];
  /** אדמין (ADMIN_EMAILS) — מועבר מהשרת, לא תלוי ב-fetch בדפדפן */
  devSwitcherCanCreate?: boolean;
  /** אדמין אתר — קישור לפאנל /admin */
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const { theme } = useSiteTheme();
  const showHeaderThemeToggle = useHeaderThemeToggleVisible();
  const [menuOpen, setMenuOpen] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const personalRef = useRef<HTMLDivElement | null>(null);

  const personalLinks = personalAreaLinks(user?.role);
  const activePersonalHref = useMemo(() => {
    const links = personalAreaLinks(user?.role);
    return getActivePersonalHref(pathname, links);
  }, [pathname, user?.role]);
  const adminNavActive = pathname.startsWith("/admin");
  const canUseMessages =
    user &&
    (user.role === "SEEKER" ||
      user.role === "VENUE_OWNER" ||
      user.role === "FREELANCER");
  const canUseNotifications = Boolean(user);

  async function handleLogout() {
    setMenuOpen(false);
    setPersonalOpen(false);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) {
        console.error("logout failed", res.status);
      }
    } catch (e) {
      console.error("logout error", e);
    }
    window.location.assign("/");
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (personalRef.current && !personalRef.current.contains(t)) {
        setPersonalOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(t)) {
        setMenuOpen(false);
      }
    }
    if (personalOpen || menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [personalOpen, menuOpen]);

  return (
    <header className="site-header relative z-50 border-b border-slate-800 bg-emerald-950 backdrop-blur-sm">
      {user ? <RealtimeEventBridge /> : null}
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-3 py-4 lg:px-4 xl:gap-4 xl:px-6">
        <div className="flex min-w-0 flex-1 items-center justify-start gap-2 xl:gap-4">
          <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-slate-50">
            Halls Hub
          </Link>
          {/* ניווט אחיד: אותם פריטי בסיס לכולם; "אזור אישי" = מה שהיה תלוי־תפקיד */}
          <nav className="hidden min-w-0 flex-1 flex-nowrap items-center gap-x-1 min-[900px]:flex xl:gap-x-2">
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
              href="/providers"
              aria-current={navKeyActive(pathname, "providers") ? "page" : undefined}
              className={`${navLinkDesktopBase} ${
                navKeyActive(pathname, "providers")
                  ? navLinkDesktopActive
                  : navLinkDesktopIdle
              }`}
            >
              שירותי ספקים
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
            {user?.role === "SEEKER" && (
              <>
                <Link
                  href="/favorites"
                  aria-current={navKeyActive(pathname, "favorites") ? "page" : undefined}
                  className={`${navLinkDesktopBase} ${
                    navKeyActive(pathname, "favorites")
                      ? navLinkDesktopActive
                      : navLinkDesktopIdle
                  }`}
                >
                  מועדפים
                </Link>
                <Link
                  href="/event-tools"
                  aria-current={navKeyActive(pathname, "eventTools") ? "page" : undefined}
                  className={`${navLinkDesktopBase} ${
                    navKeyActive(pathname, "eventTools")
                      ? navLinkDesktopActive
                      : navLinkDesktopIdle
                  }`}
                >
                  כלי תכנון
                </Link>
              </>
            )}
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
            {isAdmin ? (
              <Link
                href="/admin"
                aria-current={adminNavActive ? "page" : undefined}
                className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A227] xl:px-3 xl:text-sm ${
                  adminNavActive
                    ? "border-amber-300 bg-amber-400 text-emerald-950"
                    : "border-amber-400/60 bg-amber-400/15 text-[#F5E6A8] hover:bg-amber-400/25"
                }`}
              >
                פאנל ניהול
              </Link>
            ) : null}
            {user && personalLinks.length > 0 && (
              <div className="relative" ref={personalRef}>
                <button
                  type="button"
                  onClick={() => setPersonalOpen((v) => !v)}
                  className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-xs font-semibold transition xl:px-3 ${
                    personalOpen
                      ? "border-[#C9A227] bg-amber-400 text-white shadow-sm"
                      : activePersonalHref
                        ? "border-[#C9A227]/80 bg-amber-400/20 text-[#F5E6A8] ring-1 ring-amber-400/50"
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
                  <div className="personal-menu absolute right-0 z-[60] mt-1 min-w-[200px] rounded-2xl border border-neutral-200 bg-white py-1.5 text-right shadow-xl">
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
          {canUseDevUserSwitcher ? (
            <DevUserSwitcher
              initialUsers={devSwitcherUsers}
              canCreateManagedUsers={devSwitcherCanCreate}
            />
          ) : null}
          {showHeaderThemeToggle ? <ThemeToggle variant="header" /> : null}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className={`flex max-w-[140px] items-center gap-2 truncate rounded-full px-3 py-2 text-sm font-medium transition sm:max-w-[220px] sm:px-4 ${
                  theme === "night"
                    ? "border border-sky-400/35 bg-slate-900/50 text-sky-100 hover:bg-slate-800/60"
                    : "bg-amber-300 text-slate-900 hover:bg-amber-200"
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
                <div className="user-menu absolute left-0 z-[60] mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-neutral-200 bg-white p-2 text-right text-sm shadow-xl">
                  {/* במסכים צרים: הניווט המלא בתפריט המשתמש */}
                  <div className="border-b border-neutral-200/80 pb-2 min-[900px]:hidden">
                    <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
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
                      שירותי ספקים
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
                    {user?.role === "SEEKER" && (
                      <>
                        <Link
                          href="/favorites"
                          aria-current={
                            navKeyActive(pathname, "favorites") ? "page" : undefined
                          }
                          className={`${navLinkMobileBase} ${
                            navKeyActive(pathname, "favorites")
                              ? navLinkMobileActive
                              : navLinkMobileIdle
                          }`}
                          onClick={() => setMenuOpen(false)}
                        >
                          מועדפים
                        </Link>
                        <Link
                          href="/event-tools"
                          aria-current={
                            navKeyActive(pathname, "eventTools") ? "page" : undefined
                          }
                          className={`${navLinkMobileBase} ${
                            navKeyActive(pathname, "eventTools")
                              ? navLinkMobileActive
                              : navLinkMobileIdle
                          }`}
                          onClick={() => setMenuOpen(false)}
                        >
                          כלי תכנון
                        </Link>
                      </>
                    )}
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
                    {isAdmin ? (
                      <Link
                        href="/admin"
                        aria-current={adminNavActive ? "page" : undefined}
                        className={`${navLinkMobileBase} font-semibold ${
                          adminNavActive
                            ? "bg-amber-400/25 text-emerald-950 ring-1 ring-amber-400/60"
                            : "text-amber-900 hover:bg-amber-50"
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        פאנל ניהול
                      </Link>
                    ) : null}
                  </div>
                  {personalLinks.length > 0 && (
                    <div className="border-b border-neutral-200/80 py-2 min-[900px]:hidden">
                      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
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
                    href="/settings/profile"
                    aria-current={
                      pathname.startsWith("/settings") ? "page" : undefined
                    }
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 ${
                      pathname.startsWith("/settings")
                        ? navLinkMobileActive
                        : "text-neutral-900 hover:bg-neutral-50"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>הגדרות</span>
                  </Link>
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      aria-current={adminNavActive ? "page" : undefined}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 font-semibold ${
                        adminNavActive
                          ? navLinkMobileActive
                          : "text-amber-900 hover:bg-amber-50"
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span>פאנל ניהול</span>
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-red-700 hover:bg-red-500/10"
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
                className="rounded-full bg-amber-400 px-3 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition hover:bg-amber-300 sm:px-4"
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
