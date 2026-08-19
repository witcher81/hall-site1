/** נתיב אחרי התחברות/אימות כשאין redirect מפורש */
export function defaultPathAfterAuth(role?: string | null): string {
  if (role === "VENUE_OWNER") return "/dashboard/venue-owner/profile";
  if (role === "FREELANCER") return "/dashboard/freelancer/profile";
  return "/";
}
