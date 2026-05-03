import { randomBytes } from "node:crypto";

const FALLBACK_DOMAIN = "dev.hall-switch.local";

/**
 * כתובת ייחודית למשתמש מנוהל בדיבאג: אותו דומיין כמו האדמין, עם תג + (כמו Gmail)
 * כדי שלא יידרש אימייל נפרד בטופס ועדיין יתקיים unique ב-DB.
 */
function addPlusTagToAdminEmail(adminEmail: string): string | null {
  const t = adminEmail.trim().toLowerCase();
  const at = t.lastIndexOf("@");
  if (at < 1 || at === t.length - 1) return null;
  const domain = t.slice(at + 1);
  if (!domain.includes(".")) return null;
  let local = t.slice(0, at);
  const plus = local.indexOf("+");
  if (plus !== -1) local = local.slice(0, plus);
  const tag = randomBytes(6).toString("hex");
  const suffix = `+h${tag}`;
  const maxLocal = 64 - suffix.length;
  if (maxLocal < 1) return null;
  const truncated = local.slice(0, maxLocal);
  return `${truncated}${suffix}@${domain}`;
}

export function buildManagedDevUserEmailForAdmin(adminEmail: string): string {
  const withPlus = addPlusTagToAdminEmail(adminEmail);
  if (withPlus) return withPlus;
  const nonce = randomBytes(8).toString("hex");
  return `hall.dev.${nonce}@${FALLBACK_DOMAIN}`;
}
