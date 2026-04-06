/**
 * אדמין אתר: רשימת אימיילים מופרדת בפסיקים ב־ADMIN_EMAILS (משתנה סביבה).
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS?.trim() ?? "";
  const set = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  if (set.size === 0) return false;
  return set.has(email.toLowerCase());
}

/** האם מותר להציג /api dev switch בסביבה הנוכחית (פרודקשן רק עם דגל מפורש) */
export function allowDevUserSwitchDeployment(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.ALLOW_DEV_USER_SWITCH === "true";
}

export function canShowDevUserSwitcher(user: {
  email: string;
} | null): boolean {
  if (!user) return false;
  if (!isAdminEmail(user.email)) return false;
  return allowDevUserSwitchDeployment();
}
