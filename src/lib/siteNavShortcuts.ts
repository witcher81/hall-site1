/** קיצורי דרך ברורים — לתפריט נגישות ולברי ניווט */

export type SiteNavShortcut = {
  href: string;
  label: string;
  hint?: string;
};

export const UNIVERSAL_SITE_SHORTCUTS: SiteNavShortcut[] = [
  { href: "/", label: "דף הבית", hint: "חזרה לעמוד הראשי" },
  { href: "/halls", label: "חיפוש אולמות", hint: "מצאו אולם לאירוע" },
  { href: "/providers", label: "חיפוש ספקים", hint: "צלמים, DJ, קייטרינג ועוד" },
  { href: "/packages", label: "חבילות אירוע", hint: "חבילות מוכנות" },
  { href: "/contact", label: "יצירת קשר", hint: "שאלות ותמיכה" },
];

export function dashboardHeaderShortcuts(
  role: "freelancer" | "venue-owner"
): SiteNavShortcut[] {
  if (role === "freelancer") {
    return [
      { href: "/dashboard/freelancer", label: "סקירה — אזור ספק" },
      { href: "/dashboard/freelancer/services", label: "השירותים שלי" },
      { href: "/dashboard/freelancer/requests", label: "בקשות שהתקבלו" },
      { href: "/dashboard/freelancer/profile", label: "פרופיל ספק" },
      { href: "/messages", label: "הודעות" },
      { href: "/notifications", label: "התראות" },
    ];
  }
  return [
    { href: "/dashboard/venue-owner", label: "סקירה — אזור אולם" },
    { href: "/dashboard/venue-owner/inquiries", label: "פניות שהתקבלו" },
    { href: "/dashboard/venue-owner/profile", label: "פרופיל העסק" },
    { href: "/messages", label: "הודעות" },
    { href: "/notifications", label: "התראות" },
  ];
}

export function contextShortcutsForPath(pathname: string): SiteNavShortcut[] {
  if (pathname.startsWith("/dashboard/freelancer")) {
    return dashboardHeaderShortcuts("freelancer");
  }
  if (pathname.startsWith("/dashboard/venue-owner")) {
    return dashboardHeaderShortcuts("venue-owner");
  }
  if (
    pathname.startsWith("/dashboard/seeker") ||
    pathname.startsWith("/my-inquiries") ||
    pathname.startsWith("/my-service-requests") ||
    pathname.startsWith("/favorites")
  ) {
    return [
      { href: "/dashboard/seeker", label: "האזור האישי" },
      { href: "/my-inquiries", label: "הפניות שלי" },
      { href: "/my-service-requests", label: "בקשות לספקים" },
      { href: "/favorites", label: "מועדפים" },
      { href: "/messages", label: "הודעות" },
      { href: "/notifications", label: "התראות" },
    ];
  }
  if (pathname.startsWith("/admin")) {
    return [{ href: "/admin", label: "לוח ניהול" }];
  }
  return [];
}

/** כפתור פאנל לבעלי עסק / ספקים — ב-HomeHeader ובנגישות */
export function businessPanelForRole(
  role: string | undefined
): SiteNavShortcut | null {
  if (role === "VENUE_OWNER") {
    return {
      href: "/dashboard/venue-owner",
      label: "פאנל העסק",
      hint: "ניהול האולם, פרופיל ופניות",
    };
  }
  if (role === "FREELANCER") {
    return {
      href: "/dashboard/freelancer",
      label: "פאנל הספק",
      hint: "ניהול השירותים והבקשות",
    };
  }
  return null;
}
