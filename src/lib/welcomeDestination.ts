/** יעד אחרי הרשמה / לחיצה על התראת ברוכים הבאים */

export function welcomeDestinationHref(role: string | null | undefined): string {
  switch (role) {
    case "FREELANCER":
      return "/dashboard/freelancer/profile";
    case "VENUE_OWNER":
      return "/dashboard/venue-owner/profile";
    case "SEEKER":
      return "/halls";
    default:
      return "/halls";
  }
}

/** התראות ישנות עם href="/" עדיין מפנות לדף הבית — מתקנים לפי סוג + תפקיד */
export function resolveNotificationHref(input: {
  type: string;
  href: string | null;
  userRole: string;
}): string | null {
  const href = input.href?.trim() || null;
  if (input.type === "WELCOME" && (!href || href === "/")) {
    return welcomeDestinationHref(input.userRole);
  }
  return href;
}
